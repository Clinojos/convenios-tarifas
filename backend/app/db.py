import os
import urllib
import pyodbc
from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel
from dotenv import load_dotenv

# Corregimos la ruta: subimos un nivel (..) desde app/ para llegar a backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

# 1. Configuración de SQL Server (Hosvital)
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_server = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")

SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

if not all([db_user, db_password, db_server, db_name]):
    raise Exception(
        f"Faltan variables de entorno en {os.path.abspath(dotenv_path)}. "
        f"Valores encontrados: user={db_user}, host={db_server}, db={db_name}"
    )


def _detectar_driver_odbc() -> str:
    """
    Devuelve el nombre del driver ODBC de SQL Server a usar.

    Orden de prioridad:
      1. Variable de entorno DB_DRIVER (si existe y está instalado).
      2. ODBC Driver 18 for SQL Server
      3. ODBC Driver 17 for SQL Server
      4. Cualquier otro "ODBC Driver NN for SQL Server" instalado.
      5. "SQL Server" (driver antiguo de Windows, último recurso).
    """
    instalados = pyodbc.drivers()

    preferido = os.getenv("DB_DRIVER")
    if preferido and preferido in instalados:
        return preferido

    for candidato in ("ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server"):
        if candidato in instalados:
            return candidato

    otros = sorted(
        d for d in instalados
        if d.startswith("ODBC Driver") and d.endswith("for SQL Server")
    )
    if otros:
        return otros[-1]

    if "SQL Server" in instalados:
        return "SQL Server"

    raise Exception(
        "No se encontró ningún driver ODBC para SQL Server. "
        f"Drivers detectados por pyodbc: {instalados}. "
        "Instala 'Microsoft ODBC Driver 18 for SQL Server' (o el 17)."
    )


DB_DRIVER = _detectar_driver_odbc()

params = urllib.parse.quote_plus(
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={db_server};"
    f"DATABASE={db_name};"
    f"UID={db_user};"
    f"PWD={db_password};"
    "TrustServerCertificate=yes;"
)
DATABASE_URL_HOSVITAL = f"mssql+pyodbc:///?odbc_connect={params}"
engine_hosvital = create_engine(DATABASE_URL_HOSVITAL, echo=SQL_ECHO)

# 2. Configuración de SQLite (Local)
if not os.path.exists("./Database"):
    os.makedirs("./Database")

SQLITE_URL = "sqlite:///./Database/app_control.db"
engine_local = create_engine(SQLITE_URL, connect_args={"check_same_thread": False}, echo=SQL_ECHO)


def init_db():
    """
    Crea únicamente las tablas LOCALES (SQLite) que aún no existan.

    SQLModel.metadata es compartida entre los modelos de Hosvital (SQL Server,
    schema="dbo") y los modelos locales. Si llamamos a create_all() sin filtrar,
    SQLAlchemy intenta crear también las tablas de Hosvital dentro de SQLite,
    lo cual falla porque SQLite no reconoce el schema "dbo".

    Por eso filtramos: solo se crean las tablas cuyo `schema` es None, es decir,
    las que NO pertenecen a Hosvital.

    IMPORTANTE: para que un modelo se cree aquí, su módulo debe haber sido
    importado antes de llamar a esta función (ver imports en main.py).
    """
    local_tables = [
        table for table in SQLModel.metadata.sorted_tables
        if table.schema is None
    ]
    SQLModel.metadata.create_all(engine_local, tables=local_tables)


# 3. Sesiones
def get_session_hosvital():
    with Session(engine_hosvital) as session:
        yield session


def get_session_local():
    with Session(engine_local) as session:
        yield session