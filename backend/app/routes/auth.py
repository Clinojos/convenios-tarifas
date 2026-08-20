from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func
# 1. Importamos ambas sesiones
from ..db import get_session_hosvital, get_session_local
from ..models.user import User
# IMPORTANTE: Importamos los modelos locales para buscar roles/permisos
from ..models.roles_permissions import UserRole 

from ..auth.jwt import create_access_token, get_current_user
from ..auth.cipher import encrypt, decrypt
# Ajusta estas funciones si es necesario para que usen la sesión local
from ..services.auth_service import get_permissions_for_user, get_role_for_user, get_access_for_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    identifier: str
    password: str

@router.post("/login")
def login(
    data: LoginRequest, 
    # 2. Inyectamos las dos sesiones
    session_hosvital: Session = Depends(get_session_hosvital),
    session_local: Session = Depends(get_session_local)
):
    # Verificación en Hosvital (Remoto)
    id_cifrado  = encrypt(data.identifier.strip())
    psw_cifrado = encrypt(data.password.strip())

    statement = select(User).where(
        func.rtrim(User.id)       == id_cifrado,
        func.rtrim(User.password) == psw_cifrado
    )
    user = session_hosvital.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # user_id en claro
    user_id = decrypt(user.id).strip()

    # 3. Validamos ACCESO a la plataforma (no rol) desde la base de datos LOCAL (SQLite)
    has_access = get_access_for_user(user_id, session_local)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no tiene acceso a la plataforma. Contacta al administrador."
        )

    # 4. Obtenemos rol y permisos (pueden venir vacíos si aún no se asignó rol)
    role_name = get_role_for_user(user_id, session_local) 
    permissions = get_permissions_for_user(user_id, session_local)

    token_data = {
        "sub":         user_id,
        "role":        role_name,      # puede ser None si aún no tiene rol
        "permissions": permissions     # puede ser [] si aún no tiene rol
    }

    return {"access_token": create_access_token(token_data), "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Este endpoint permite al frontend verificar la sesión actual
    del usuario basado en su token JWT.
    """
    return current_user