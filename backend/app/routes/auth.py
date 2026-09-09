from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import func
from datetime import datetime

from ..db import get_session_hosvital, get_session_local
from ..models.user import User
from ..models.user_profile import UserProfile

from ..auth.jwt import create_access_token, get_current_user
from ..auth.cipher import encrypt, decrypt
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    identifier: str
    password: str


class AliasUpdate(BaseModel):
    display_name: str | None


@router.post("/login")
def login(
    data: LoginRequest,
    session_hosvital: Session = Depends(get_session_hosvital),
    session_local: Session = Depends(get_session_local),
):
    identifier = data.identifier.strip()
    password = data.password.strip()

    if not identifier or not password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # --- Verificación de credenciales en Hosvital (Remoto) ---
    id_cifrado = encrypt(identifier)
    psw_cifrado = encrypt(password)

    statement = select(User).where(
        func.rtrim(User.id) == id_cifrado,
        func.rtrim(User.password) == psw_cifrado,
    )
    user = session_hosvital.exec(statement).first()

    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    # --- Validación de estado del usuario (AUsrEst) ---
    is_active = (user.status or "").strip().upper() == "S"

    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu usuario está inactivo. Contacta al administrador.",
        )

    # --- Datos en claro ---
    user_id = decrypt(user.id).strip()

    # Ya no hay roles ni permisos: todos los usuarios activos tienen el mismo acceso.
    token_data = {
        "sub": user_id,
    }

    return {"access_token": create_access_token(token_data), "token_type": "bearer"}


@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user),
    session_local: Session = Depends(get_session_local),
):
    """
    Devuelve la identidad del usuario actual: si tiene un alias
    guardado en local (SQLite), se usa ese; si no, se usa el nombre
    real de Hosvital. Siempre incluye el user_id crudo también.
    """
    user_id = current_user["sub"]

    profile = session_local.get(UserProfile, user_id)

    # TODO: reemplazar por el nombre real que traigas de Hosvital
    # (por ahora cae al user_id si no hay alias)
    real_name = user_id

    display_name = (
        profile.display_name if profile and profile.display_name else real_name
    )

    return {
        "user_id": user_id,
        "name": display_name,
        "initial": display_name[0].upper() if display_name else "?",
        "photo_url": profile.photo_url if profile else None,
    }


@router.put("/me/alias")
def update_alias(
    payload: AliasUpdate,
    current_user: dict = Depends(get_current_user),
    session_local: Session = Depends(get_session_local),
):
    """
    Permite al usuario definir (o quitar, si manda null) su alias
    visible en el sidebar.
    """
    user_id = current_user["sub"]

    profile = session_local.get(UserProfile, user_id)
    if not profile:
        profile = UserProfile(user_id=user_id)

    profile.display_name = payload.display_name
    profile.updated_at = datetime.utcnow()

    session_local.add(profile)
    session_local.commit()

    return {"ok": True, "display_name": profile.display_name}