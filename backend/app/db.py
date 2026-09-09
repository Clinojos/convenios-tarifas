import os
import urllib
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

params = urllib.parse.quote_plus(
    "DRIVER={ODBC Driver 17 for SQL Server};"
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
    pass

# 3. Sesiones
def get_session_hosvital():
    with Session(engine_hosvital) as session:
        yield session

def get_session_local():
    with Session(engine_local) as session:
        yield session