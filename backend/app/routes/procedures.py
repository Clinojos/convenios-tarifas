from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from ..db import get_session_hosvital
from app.models.procedure import Procedure
from app.auth.permissions import require_permission
from app.services.search_engine import apply_search_filter
from app.services.pricing_service import get_procedure_price

router = APIRouter(prefix="/api/v1/procedures", tags=["Procedures"])


@router.get("/")
def list_procedures(
    session: Session = Depends(get_session_hosvital),
    page: int = 1,
    limit: int = 50,
    q: str = None,
    status: str = None,
    _ = Depends(require_permission("procedures:view"))
):
    query = select(Procedure).where(Procedure.PRCODI.isnot(None))
    query = apply_search_filter(query, Procedure, q)

    if status:
        val_estado = 'A' if status == 'active' else 'N'
        query = query.where(Procedure.PrSta == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()

    offset = (page - 1) * limit
    results = session.exec(
        query
        .order_by(Procedure.PrNomb)
        .offset(offset)
        .limit(limit)
    ).all()

    output = []
    for proc in results:
        try:
            output.append({
                "code": str(proc.PRCODI).strip(),
                "name": str(proc.PrNomb).strip(),
                "status": "Activo" if str(proc.PrSta).strip() == 'A' else "Inactivo",
                "gender": str(proc.PrSexo).strip() if proc.PrSexo else "A",
                "min_age": proc.PrEdInc or 0,
                "max_age": proc.PrEdFnl or 0,
                "is_home_care": str(proc.PrAtnDom).strip() == 'S',
                "requires_auth": str(proc.PrConSN).strip() == 'S'
            })
        except Exception as e:
            print(f"Error procesando procedimiento {proc.PRCODI}: {e}")
            continue

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "data": output
    }


@router.get("/total")
def get_procedures_total(
    session: Session = Depends(get_session_hosvital),
    q: str = None,
    status: str = None,
    _ = Depends(require_permission("procedures:view"))
):
    query = select(Procedure).where(Procedure.PRCODI.isnot(None))
    query = apply_search_filter(query, Procedure, q)

    if status:
        val_estado = 'A' if status == 'active' else 'N'
        query = query.where(Procedure.PrSta == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()

    return {"total": total_records}


@router.get("/price")
def procedure_price(
    nit: str,
    proc_code: str,
    session: Session = Depends(get_session_hosvital),
    _ = Depends(require_permission("procedures:view"))
):
    result = get_procedure_price(session, nit, proc_code)
    if not result:
        raise HTTPException(status_code=404, detail="No price found for this combination")
    return result

from app.services.pricing_service import (
    get_procedure_price,
    get_portfolios_by_contract,
    get_procedures_by_portfolio,
)

@router.get("/portfolios")
def portfolios_by_contract(
    nit: str,
    session: Session = Depends(get_session_hosvital),
    _ = Depends(require_permission("procedures:view"))
):
    return get_portfolios_by_contract(session, nit)


@router.get("/by-portfolio")
def procedures_by_portfolio(
    portfolio_code: str,
    q: str = None,
    page: int = 1,
    limit: int = 50,
    session: Session = Depends(get_session_hosvital),
    _ = Depends(require_permission("procedures:view"))
):
    return get_procedures_by_portfolio(session, portfolio_code, q, page, limit)