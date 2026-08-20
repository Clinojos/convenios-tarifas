from fastapi import APIRouter, Depends
from sqlmodel import Session, select, or_
from pydantic import BaseModel
from typing import List
# 1. CAMBIO: Importamos la sesión de Hosvital
from ..db import get_session_hosvital 
from app.models.agreement import Agreement
from app.models.procedure import Procedure

router = APIRouter(prefix="/api/v1/search", tags=["search"])

class SearchResult(BaseModel):
    id: str
    title: str
    type: str
    details: str
    route: str

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]

@router.get("/", response_model=SearchResponse)
async def search_all(
    q: str, 
    # 2. CAMBIO: Inyectamos la sesión del hospital
    session: Session = Depends(get_session_hosvital) 
):
    results = []
    
    # 3. Búsqueda en Convenios
    stmt_agreement = select(Agreement).where(
        or_(Agreement.MENOMB.ilike(f"%{q}%"), Agreement.MENNIT.ilike(f"%{q}%"))
    )
    agreements = session.exec(stmt_agreement).all()
    for a in agreements:
        results.append({
            "id": f"conv-{str(a.MENNIT).strip()}", 
            "title": str(a.MENOMB).strip(),
            "type": "Convenio",
            "details": f"Estado: {'Activo' if str(a.MEestado).strip() == '1' else 'Inactivo'}",
            "route": "/contracts"
        })
    
    # 4. Búsqueda en Procedimientos
    stmt_procedure = select(Procedure).where(
        or_(Procedure.PrNomb.ilike(f"%{q}%"), Procedure.PRCODI.ilike(f"%{q}%"))
    )
    procedures = session.exec(stmt_procedure).all()
    for p in procedures:
        results.append({
            "id": f"proc-{str(p.PRCODI).strip()}", 
            "title": str(p.PrNomb).strip(),
            "type": "Procedimiento",
            "details": f"Código: {str(p.PRCODI).strip()} | Estado: {'Activo' if str(p.PrSta).strip() == 'A' else 'Inactivo'}",
            "route": "/procedures"
        })
    
    return {"query": q, "results": results}