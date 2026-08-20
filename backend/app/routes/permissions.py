from fastapi import APIRouter, Depends
from sqlmodel import Session, select
# 1. IMPORTANTE: Cambia a la sesión local
from ..db import get_session_local 
from ..models.roles_permissions import Permission
from ..auth.permissions import require_permission

# Definimos un prefijo limpio
router = APIRouter(prefix="/api/v1/permissions", tags=["permissions"])

@router.get("/")
def list_permissions(
    # 2. Inyecta la sesión local
    session: Session = Depends(get_session_local),
    _ = Depends(require_permission("roles:view"))  # <--- Actualizado al nuevo formato agrupado
):
    statement = select(Permission)
    results = session.exec(statement).all()
    
    return [
        {
            "id": str(p.id),
            "name": p.name if p.name else p.slug.replace(':', ' ').replace('_', ' ').capitalize(),
            "slug": p.slug
        } 
        for p in results
    ]