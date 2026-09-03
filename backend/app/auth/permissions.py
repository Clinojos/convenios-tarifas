# backend/app/auth/permissions.py
from fastapi import Depends, HTTPException, status
from .jwt import get_current_user 

def require_permission(permission: str):
    def dependency(payload: dict = Depends(get_current_user)):
        user_permissions = payload.get("permissions", [])
        
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"No tienes permiso. Esperaba '{permission}' pero encontré {user_permissions}"
            )
        return True
    return dependency