from typing import Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..db import get_session_hosvital
from ..models.user import User
from ..auth.cipher import decrypt
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/list")
def list_users(
    session_h: Session = Depends(get_session_hosvital),
    page: int = 1,
    limit: int = 50,
    order: str = "asc",
    q: Optional[str] = None,
    _current_user: dict = Depends(get_current_user),
):
    # Todos los usuarios activos en Hosvital tienen el mismo nivel de acceso.
    users_hosvital = session_h.exec(
        select(User).where(User.status == "S")
    ).all()

    q_normalized = q.strip().lower() if q else None
    processed_users = []

    for user in users_hosvital:
        try:
            uid = decrypt(user.id).strip()
        except Exception as e:
            print(f"[list_users] Error desencriptando id de usuario: {e}")
            continue

        try:
            uname = decrypt(user.description).strip()
        except Exception as e:
            print(f"[list_users] Error desencriptando nombre de usuario: {e}")
            uname = user.description.strip()

        if q_normalized and q_normalized not in uid.lower() and q_normalized not in uname.lower():
            continue

        processed_users.append({
            "id": uid,
            "name": uname,
        })

    processed_users.sort(key=lambda x: x["id"], reverse=(order == "desc"))
    total = len(processed_users)
    start = (page - 1) * limit

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": processed_users[start: start + limit],
    }