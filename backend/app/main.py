from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .routes import auth, search, procedures, agreement, users
from .db import init_db  # Importamos la función de inicialización

# Importante: hay que importar todos los modelos locales (SQLite) para que
# SQLModel los registre en local_metadata ANTES de llamar a init_db().
# Si un modelo nuevo no se importa aquí (o en algún módulo que sí se importe),
# su tabla nunca se crea, aunque el archivo del modelo exista.
from .models import user_profile, procedure_visit, agreement_visit  # noqa: F401

# Inicializamos la app
app = FastAPI(title="Hosvital API", version="1.0.0")

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.81:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejador global para errores de validación
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "message": "Missing required fields or invalid format.",
            "details": [e["loc"][-1] for e in exc.errors()]
        }
    )

# Evento de inicio: crea la BD local automáticamente si no existe
@app.on_event("startup")
def on_startup():
    init_db()

# Registrar rutas
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(procedures.router)
app.include_router(agreement.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Hosvital API is active"}