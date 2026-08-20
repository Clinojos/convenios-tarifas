from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db import get_session_hosvital, get_session_local
from ..models.user import User
from ..models.roles_permissions import Role, UserRole, UserAccess
from ..auth.permissions import require_permission
from ..auth.cipher import decrypt
from ..services.auth_service import set_user_access

router = APIRouter(prefix="/api/v1/users", tags=["users"])

@router.get("/list")
def list_users(
    session_h: Session = Depends(get_session_hosvital),
    session_l: Session = Depends(get_session_local),
    page: int = 1,
    limit: int = 50,
    order: str = "asc",
    type: str = "all",
    q: Optional[str] = None,
    _ = Depends(require_permission("users:view"))
):
    users_hosvital = session_h.exec(
        select(User).where(User.status == "S")
    ).all()

    user_roles_map = {}
    for ur, r in session_l.exec(
        select(UserRole, Role).join(Role, UserRole.role_id == Role.id)
    ).all():
        try:
            key = decrypt(ur.user_id).strip()
            user_roles_map[key] = r
        except Exception as e:
            print(f"[list_users] Error desencriptando user_id de UserRole: {e}")
            continue

    # Mapa de accesos desde user_access (incluye protected)
    user_access_map = {}
    for ua in session_l.exec(select(UserAccess)).all():
        try:
            key = decrypt(ua.user_id).strip()
            user_access_map[key] = {
                "access": bool(ua.access),
                "protected": bool(ua.protected),
            }
        except Exception as e:
            print(f"[list_users] Error desencriptando user_id de UserAccess: {e}")
            continue

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

        role = user_roles_map.get(uid)
        access_info = user_access_map.get(uid, {"access": False, "protected": False})
        has_access = access_info["access"]
        is_protected = access_info["protected"]
        is_pending = role is None

        # "with_access" filtra por ACCESO (columna user_access), no por rol
        if type == "with_access" and not has_access:
            continue
        # "pending" sigue filtrando por ausencia de rol
        if type == "pending" and not is_pending:
            continue
        if q_normalized and q_normalized not in uid.lower():
            continue

        processed_users.append({
            "id": uid,
            "name": uname,
            "isPending": is_pending,
            "hasAccess": has_access,
            "isProtected": is_protected,  # 👈 nuevo
            "role": {"id": str(role.id), "name": role.name} if role else None
        })

    processed_users.sort(key=lambda x: x["id"], reverse=(order == "desc"))
    total = len(processed_users)
    start = (page - 1) * limit

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": processed_users[start: start + limit]
    }


class UserAccessUpdate(BaseModel):
    access: bool

@router.patch("/{user_id}/access")
def update_user_access(
    user_id: str,
    body: UserAccessUpdate,
    session_l: Session = Depends(get_session_local),
    _ = Depends(require_permission("users:edit"))
):
    set_user_access(user_id, body.access, session_l)
    return {"user_id": user_id, "access": body.access}