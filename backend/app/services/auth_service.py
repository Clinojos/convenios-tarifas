from sqlalchemy import text
from fastapi import HTTPException
from sqlmodel import Session
from ..auth.cipher import encrypt


def get_permissions_for_user(user_id: str, session: Session) -> list[str]:
    user_id_cifrado = encrypt(user_id)

    # 👇 Si el rol es super admin, devuelve TODOS los permisos existentes,
    # sin depender de role_permissions (así los permisos nuevos ya quedan incluidos)
    is_admin_query = text("""
        SELECT R.is_super_admin
        FROM roles R
        JOIN user_roles UR ON R.id = UR.role_id
        WHERE UR.user_id = :user_id
    """)
    admin_row = session.execute(is_admin_query, {"user_id": user_id_cifrado}).fetchone()
    if admin_row and admin_row[0]:
        all_perms = session.execute(text("SELECT slug FROM permissions")).fetchall()
        return [p[0] for p in all_perms]

    query = text("""
        SELECT P.slug
        FROM permissions P
        JOIN role_permissions RP ON P.id = RP.permission_id
        JOIN user_roles UR ON RP.role_id = UR.role_id
        WHERE UR.user_id = :user_id
    """)
    results = session.execute(query, {"user_id": user_id_cifrado}).fetchall()
    return [row[0] for row in results]


def get_role_for_user(user_id: str, session: Session) -> str | None:
    user_id_cifrado = encrypt(user_id)
    query = text("""
        SELECT R.name
        FROM roles R
        JOIN user_roles UR ON R.id = UR.role_id
        WHERE UR.user_id = :user_id
    """)
    row = session.execute(query, {"user_id": user_id_cifrado}).fetchone()
    return row[0] if row else None


def get_access_for_user(user_id: str, session: Session) -> bool:
    user_id_cifrado = encrypt(user_id)
    query = text("""
        SELECT access
        FROM user_access
        WHERE user_id = :user_id
    """)
    row = session.execute(query, {"user_id": user_id_cifrado}).fetchone()
    return bool(row[0]) if row else False


def set_user_access(user_id: str, grant: bool, session: Session) -> None:
    """
    Actualiza (o crea) el acceso del usuario en user_access.
    Si se revoca el acceso, también se le quita cualquier rol asignado en user_roles.
    Los usuarios marcados como protected no pueden perder el acceso.
    """
    user_id_cifrado = encrypt(user_id)

    # 👇 Bloqueo: si el usuario está protegido, no se le puede revocar el acceso
    if not grant:
        protected_row = session.execute(
            text("SELECT protected FROM user_access WHERE user_id = :user_id"),
            {"user_id": user_id_cifrado},
        ).fetchone()
        if protected_row and protected_row[0]:
            raise HTTPException(
                status_code=403,
                detail="Este usuario está protegido y no se le puede revocar el acceso."
            )

    upsert_query = text("""
        INSERT INTO user_access (user_id, access)
        VALUES (:user_id, :access)
        ON CONFLICT(user_id) DO UPDATE SET access = :access
    """)
    session.execute(upsert_query, {"user_id": user_id_cifrado, "access": grant})

    if not grant:
        session.execute(
            text("DELETE FROM user_roles WHERE user_id = :user_id"),
            {"user_id": user_id_cifrado},
        )

    session.commit()