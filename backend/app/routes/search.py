from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, or_, and_
from sqlalchemy import case, func
from pydantic import BaseModel

from ..db import get_session_hosvital
from app.models.agreement import Agreement
from app.models.agreement_portfolio import AgreementPortfolio
from app.models.portfolio import Portfolio
from app.models.portfolio_item import PortfolioItem
from app.models.procedure import Procedure
from app.models.tariff import Tariff, ProcedurePrice
from app.auth.permissions import require_permission
from app.services.company_lookup import effective_company_key, get_terceros_names

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


def _agreement_term_filter(term: str):
    like_contains = f"%{term}%"
    # los NIT/códigos casi siempre se escriben desde el inicio -> con
    # prefijo (sin % al comienzo) SQL Server puede usar índice si existe,
    # en vez de escanear toda la tabla como con %term%
    nit_cond = Agreement.MENNIT.ilike(f"{term}%") if term.isdigit() else Agreement.MENNIT.ilike(like_contains)
    return or_(Agreement.MENOMB.ilike(like_contains), nit_cond)


def _procedure_term_filter(term: str):
    like_contains = f"%{term}%"
    code_cond = Procedure.PRCODI.ilike(f"{term}%") if term.isdigit() else Procedure.PRCODI.ilike(like_contains)
    return or_(
        code_cond,
        Procedure.PrNomb.ilike(like_contains),
        Portfolio.PTDesc.ilike(like_contains),
        Agreement.MENOMB.ilike(like_contains),
    )


# MEestado: '0' = Activo, '1' = Inactivo (invertido). Este CASE hace que
# SQL calcule "activo primero" ANTES de aplicar OFFSET/LIMIT, para que la
# separación activo/inactivo sea estable en toda la lista y no solo dentro
# de la página que ya se cargó (eso era lo que antes se intentaba arreglar
# a mano en el frontend, y no podía funcionar bien con paginación).
def _active_first_order(estado_col):
    return case(
        (func.rtrim(func.ltrim(estado_col)) == "0", 0),
        else_=1,
    )


def _search_agreements(session: Session, q: str, limit: int, offset: int) -> tuple[list[dict], bool]:
    terms = _tokenize(q)
    term_conditions = [_agreement_term_filter(t) for t in terms]

    stmt = (
        select(Agreement)
        .where(Agreement.MENNIT.isnot(None))
        .where(and_(*term_conditions))
        .order_by(_active_first_order(Agreement.MEestado), Agreement.MENNIT)
        .offset(offset)
        .limit(limit + 1)
    )
    agreements = session.exec(stmt).all()

    has_more = len(agreements) > limit
    agreements = agreements[:limit]

    out = []
    for a in agreements:
        is_active = str(a.MEestado).strip() == "0"
        out.append({
            "id": f"conv-{str(a.MENNIT).strip()}",
            "title": str(a.MENOMB).strip() if a.MENOMB else "",
            "type": "Convenio",
            "details": f"Estado: {'Activo' if is_active else 'Inactivo'}",
            "route": f"/convenios/{str(a.MENNIT).strip()}",
            "is_active": is_active,
        })
    return out, has_more


def _search_procedures(session: Session, q: str, limit: int, offset: int) -> tuple[list[dict], bool]:
    """Busca procedimientos y trae, para cada coincidencia, en qué
    portafolio/convenio/empresa está y a qué precio. Búsqueda "inteligente"
    multi-palabra: cada palabra puede matchear en un campo distinto (código,
    nombre, portafolio, convenio) y en cualquier orden, siempre que TODAS
    las palabras aparezcan en algún lado de esa fila. Los términos
    puramente numéricos usan prefijo (más rápido, puede usar índice) en
    vez de substring.
    """
    terms = _tokenize(q)
    term_conditions = [_procedure_term_filter(t) for t in terms]

    stmt = (
        select(Procedure, PortfolioItem, Portfolio, Agreement, Tariff, ProcedurePrice)
        .join(PortfolioItem, PortfolioItem.PRCODI == Procedure.PRCODI)
        .join(Portfolio, Portfolio.PTCodi == PortfolioItem.PTCodi)
        .join(AgreementPortfolio, AgreementPortfolio.PTCodi == Portfolio.PTCodi)
        .join(Agreement, Agreement.MENNIT == AgreementPortfolio.MENNIT)
        .join(Tariff, Tariff.TrfCod == PortfolioItem.TrfCod)
        .join(
            ProcedurePrice,
            (ProcedurePrice.PRCODI == PortfolioItem.PRCODI)
            & (ProcedurePrice.TrfCod == PortfolioItem.TrfCod),
            isouter=True,
        )
        .where(PortfolioItem.PTIndExc == "N")
        .where(and_(*term_conditions))
        # El procedimiento hereda el estado del convenio (Agreement.MEestado),
        # así que ese es el campo que hay que usar acá para "activos primero".
        # Se mantiene el resto del orden (PRCODI, MENNIT, PTCodi) como
        # criterio de desempate, igual que antes, para que las páginas
        # sigan siendo estables (MSSQL exige ORDER BY para usar OFFSET/LIMIT).
        .order_by(
            _active_first_order(Agreement.MEestado),
            Procedure.PRCODI,
            Agreement.MENNIT,
            Portfolio.PTCodi,
        )
        .offset(offset)
        .limit(limit + 1)
    )
    rows = session.exec(stmt).all()

    has_more = len(rows) > limit
    rows = rows[:limit]

    # nombre real de empresa (TERCEROS) para todas las coincidencias, en un solo batch
    company_keys = list({
        effective_company_key(a.MEcntr, a.MENNIT) for _, _, _, a, _, _ in rows
    })
    terceros_map = get_terceros_names(session, company_keys)

    out = []
    for proc, item, portfolio, agreement, tariff, price in rows:
        base = price.HomProVlr if price else 0
        final_price = round(base * item.PTPorc / 100, 2)
        contract_key = str(agreement.MENNIT).strip()
        company_key = effective_company_key(agreement.MEcntr, agreement.MENNIT)
        convenio_name = str(agreement.MENOMB).strip() if agreement.MENOMB else ""
        company_name = terceros_map.get(company_key) or convenio_name
        is_active = str(agreement.MEestado).strip() == "0"

        out.append({
            "id": f"proc-{proc.PRCODI.strip()}-{contract_key}-{portfolio.PTCodi}",
            "title": proc.PrNomb.strip(),
            "type": "Procedimiento",
            "details": f"{company_name} · {portfolio.PTDesc.strip()} · ${final_price:,.2f}",
            "route": (
                f"/convenios/{contract_key}"
                f"?highlight={proc.PRCODI.strip()}&portfolio={portfolio.PTCodi}"
            ),
            "convenio_name": convenio_name or None,
            "is_active": is_active,
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

    agreements, agreements_more = _search_agreements(session, q, limit, offset)
    procedures, procedures_more = _search_procedures(session, q, limit, offset)

    results = agreements + procedures
    has_more = agreements_more or procedures_more

    return {"query": q, "results": results, "has_more": has_more}