from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, or_, and_
from pydantic import BaseModel

from ..db import get_session_hosvital
from app.models.portfolio import Portfolio
from app.models.procedure import Procedure

router = APIRouter(prefix="/api/v1/search", tags=["search"])


class SearchResult(BaseModel):
    id: str
    title: str
    type: str
    details: str
    route: str
    convenio_name: Optional[str] = None
    is_active: Optional[bool] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    has_more: bool


def _tokenize(q: str) -> list[str]:
    # "088402 medimas" -> ["088402", "medimas"]; ignora espacios de más
    return [t for t in q.strip().split() if t]


def _search_procedures(session: Session, q: str, limit: int, offset: int) -> tuple[list[dict], bool]:
    """Busca SOLO por código o nombre del procedimiento (sin joins a
    convenios/portafolios/precios). El detalle comparativo vive en
    GET /api/v1/procedures/{code}, no acá."""
    terms = _tokenize(q)

    def term_filter(term: str):
        if term.isdigit():
            # PRCODI guarda el código CUPS con cero a la izquierda a 6 dígitos
            # (ej: "82602" -> "082602"), así que probamos el prefix match tanto
            # contra el término tal cual como contra su versión rellenada.
            padded = term.zfill(6)
            code_cond = or_(
                Procedure.PRCODI.ilike(f"{term}%"),
                Procedure.PRCODI.ilike(f"{padded}%"),
            )
        else:
            code_cond = Procedure.PRCODI.ilike(f"%{term}%")
        return or_(code_cond, Procedure.PrNomb.ilike(f"%{term}%"))

    term_conditions = [term_filter(t) for t in terms]

    stmt = (
        select(Procedure)
        .where(and_(*term_conditions))
        .order_by(Procedure.PrNomb)
        .offset(offset)
        .limit(limit + 1)
    )
    procedures = session.exec(stmt).all()

    has_more = len(procedures) > limit
    procedures = procedures[:limit]

    out = []
    for proc in procedures:
        code = proc.PRCODI.strip()
        out.append({
            "id": f"proc-{code}",
            "title": f"{code} {proc.PrNomb.strip()}",
            "type": "Procedimiento",
            "details": "",
            "route": f"/procedimientos/{code}",
        })
    return out, has_more


@router.get("/", response_model=SearchResponse)
async def search_all(
    q: str,
    limit: int = 8,
    offset: int = 0,
    session: Session = Depends(get_session_hosvital),
):
    if not q or len(q.strip()) < 1:
        return {"query": q, "results": [], "has_more": False}

    procedures, has_more = _search_procedures(session, q, limit, offset)
    return {"query": q, "results": procedures, "has_more": has_more}