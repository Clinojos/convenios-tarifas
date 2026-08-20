from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, delete
from ..db import get_session_local  # <--- Importante: sesión local para roles
from ..models.roles_permissions import Role, RolePermission, Permission, UserRole
from ..auth.permissions import require_permission
from ..auth.cipher import encrypt
from pydantic import BaseModel
import uuid

class RoleSchema(BaseModel):
    name: str
    description: str = ""
    permissionIds: list[str] = []

class AssignRoleSchema(BaseModel):
    user_id: str
    role_id: str

router = APIRouter(prefix="/api/v1/roles", tags=["roles"])

@router.get("/", status_code=status.HTTP_200_OK)
def list_roles(
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:view"))
):
    roles = session.exec(select(Role)).all()
    response = []
    for r in roles:
        assigned_perms = session.exec(
            select(RolePermission).where(RolePermission.role_id == r.id)
        ).all()
        response.append({
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "isSuperAdmin": r.is_super_admin,   # 👈 nuevo
            "isSystem": r.is_system,             # 👈 nuevo
            "permissions": [{"id": str(rp.permission_id)} for rp in assigned_perms]
        })
    return response

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleSchema,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:create"))
):
    try:
        new_role = Role(
            name=role_data.name.strip(),
            description=role_data.description,
        )
        session.add(new_role)
        session.flush()

        for p_id in role_data.permissionIds:
            session.add(RolePermission(role_id=new_role.id, permission_id=uuid.UUID(p_id)))

        session.commit()
        return {"message": "Rol creado exitosamente"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{role_id}", status_code=status.HTTP_200_OK)
def update_role(
    role_id: str,
    role_data: RoleSchema,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:update"))
):
    role = session.get(Role, uuid.UUID(role_id))
    if not role:
        raise HTTPException(status_code=404, detail="El rol no existe")

    # 👇 Bloqueo: los roles del sistema no se pueden editar
    if role.is_system:
        raise HTTPException(
            status_code=403,
            detail="Este rol es del sistema y no puede modificarse."
        )

    try:
        role.name = role_data.name.strip()
        role.description = role_data.description

        session.exec(delete(RolePermission).where(RolePermission.role_id == uuid.UUID(role_id)))
        for p_id in role_data.permissionIds:
            session.add(RolePermission(role_id=uuid.UUID(role_id), permission_id=uuid.UUID(p_id)))

        session.commit()
        return {"message": "Rol actualizado exitosamente"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{role_id}", status_code=status.HTTP_200_OK)
def delete_role(
    role_id: str,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:delete"))
):
    role = session.get(Role, uuid.UUID(role_id))
    if not role:
        raise HTTPException(status_code=404, detail="El rol no existe")

    # 👇 Bloqueo: los roles del sistema no se pueden eliminar
    if role.is_system:
        raise HTTPException(
            status_code=403,
            detail="Este rol es del sistema y no puede eliminarse."
        )

    try:
        session.exec(delete(RolePermission).where(RolePermission.role_id == uuid.UUID(role_id)))
        session.exec(delete(UserRole).where(UserRole.role_id == uuid.UUID(role_id)))
        session.delete(role)
        session.commit()
        return {"message": "Rol eliminado exitosamente"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/assign", status_code=status.HTTP_200_OK)
def assign_role_to_user(
    data: AssignRoleSchema,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:update"))
):
    user_id_cifrado = encrypt(data.user_id)

    # 👇 Bloqueo: si el usuario tiene un rol protegido, no se le puede reemplazar
    existing = session.exec(
        select(UserRole).where(UserRole.user_id == user_id_cifrado)
    ).first()
    if existing and existing.protected:
        raise HTTPException(
            status_code=403,
            detail="Este usuario tiene un rol protegido y no puede modificarse."
        )

    session.exec(delete(UserRole).where(UserRole.user_id == user_id_cifrado))
    session.add(UserRole(user_id=user_id_cifrado, role_id=uuid.UUID(data.role_id)))
    session.commit()
    return {"message": f"Rol asignado al usuario {data.user_id}"}

@router.delete("/assign/{user_id}", status_code=status.HTTP_200_OK)
def remove_role_from_user(
    user_id: str,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:update"))
):
    user_id_cifrado = encrypt(user_id)

    # 👇 Bloqueo: no se le puede quitar el rol a un usuario protegido
    existing = session.exec(
        select(UserRole).where(UserRole.user_id == user_id_cifrado)
    ).first()
    if existing and existing.protected:
        raise HTTPException(
            status_code=403,
            detail="Este usuario tiene un rol protegido y no puede modificarse."
        )

    session.exec(delete(UserRole).where(UserRole.user_id == user_id_cifrado))
    session.commit()
    return {"message": f"Rol removido del usuario {user_id}"}

@router.get("/user/{user_id}", status_code=status.HTTP_200_OK)
def get_user_role(
    user_id: str,
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:view"))
):
    user_id_cifrado = encrypt(user_id)
    ur = session.exec(select(UserRole).where(UserRole.user_id == user_id_cifrado)).first()
    if not ur:
        return {"user_id": user_id, "role": None}
    role = session.get(Role, ur.role_id)
    return {"user_id": user_id, "role": {"id": str(role.id), "name": role.name}}