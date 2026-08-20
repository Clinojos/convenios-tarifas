from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..db import get_session_hosvital
from ..models.contract import Contract
# 1. Importa el guardián de permisos
from ..auth.permissions import require_permission 

router = APIRouter(prefix="/api/v1/contracts", tags=["contracts"])

# 2. Agrega la dependencia en la ruta que quieres proteger
@router.get("/", summary="List all contracts")
def list_contracts(
    session: Session = Depends(get_session_hosvital),
    _ = Depends(require_permission("view_contracts")) # <--- El guardián actúa aquí
):
    statement = select(Contract)
    results = session.exec(statement).all()
    return results