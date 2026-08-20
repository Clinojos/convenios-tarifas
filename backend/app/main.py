from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from .routes import auth, search, contracts, procedures, roles, permissions, agreement, users
from .db import init_db  # Importamos la función de inicialización

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

# 1. Evento de inicio: Aquí creamos la BD automáticamente
@app.on_event("startup")
def on_startup():
    init_db()  # Esto crea tu archivo .db en la carpeta Database
    print("API iniciada y base de datos local verificada.")

# 2. Registrar rutas
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(contracts.router)
app.include_router(procedures.router)
app.include_router(roles.router)
app.include_router(permissions.router)
app.include_router(agreement.router)
app.include_router(users.router)

@app.get("/")
def read_root():
    return {"message": "Hosvital API is active"}