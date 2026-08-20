from sqlmodel import SQLModel, Field, MetaData
import uuid
from typing import Optional

# Contenedor exclusivo para las tablas locales
local_metadata = MetaData()

class Role(SQLModel, table=True, metadata=local_metadata):
    __tablename__ = "roles"  # Nombre actualizado de la tabla

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: Optional[str] = None
    is_super_admin: bool = Field(default=False)  # tiene todos los permisos automáticamente
    is_system: bool = Field(default=False)        # no se puede editar/eliminar desde el UI

class Permission(SQLModel, table=True, metadata=local_metadata):
    __tablename__ = "permissions"  # Nombre actualizado de la tabla

    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: str = Field(unique=True)
    name: Optional[str] = None

class RolePermission(SQLModel, table=True, metadata=local_metadata):
    __tablename__ = "role_permissions"  # Nombre actualizado de la tabla puente

    role_id: uuid.UUID = Field(primary_key=True, foreign_key="roles.id")
    permission_id: uuid.UUID = Field(primary_key=True, foreign_key="permissions.id")

class UserRole(SQLModel, table=True, metadata=local_metadata):
    __tablename__ = "user_roles"  # Nombre actualizado de la tabla puente

    user_id: str = Field(primary_key=True)
    role_id: uuid.UUID = Field(primary_key=True, foreign_key="roles.id")
    protected: bool = Field(default=False)  # no se le puede quitar este rol al usuario

class UserAccess(SQLModel, table=True, metadata=local_metadata):
    __tablename__ = "user_access"

    user_id: str = Field(primary_key=True)
    access: bool = Field(default=False)
    protected: bool = Field(default=False)  # no se le puede revocar el acceso al usuario