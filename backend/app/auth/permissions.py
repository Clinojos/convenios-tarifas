# backend/app/auth/permissions.py
from fastapi import Depends, HTTPException, status
from .jwt import get_current_user 

def require_permission(permission: str):
    def dependency(payload: dict = Depends(get_current_user)):
        user_permissions = payload.get("permissions", [])
        
        # --- AGREGAR ESTO ---
        print(f"DEBUG: Permisos en el token: {user_permissions}")
        print(f"DEBUG: Permiso requerido: '{permission}'")
        print(f"DEBUG: ¿Es '{permission}' igual a '{user_permissions[0] if user_permissions else 'NADA'}'?")
        # --------------------
        
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"No tienes permiso. Esperaba '{permission}' pero encontré {user_permissions}"
            )
        return True
    return dependency