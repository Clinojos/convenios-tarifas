from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from ..db import get_session_hosvital
from app.models.procedure import Procedure
from app.models.agreement import Agreement
from app.models.agreement_portfolio import AgreementPortfolio
from app.models.portfolio import Portfolio
from app.models.portfolio_item import PortfolioItem
from app.models.tariff import Tariff, ProcedurePrice
from app.auth.permissions import require_permission
from app.services.search_engine import apply_search_filter
from app.services.pricing_service import (
    get_procedure_price,
    get_portfolios_by_contract,
    get_procedures_by_portfolio,
)
from app.services.company_lookup import effective_company_key, get_terceros_names

router = APIRouter(prefix="/api/v1/procedures", tags=["Procedures"])


def _trimmed(col):
    # Varios campos de este backend (PRCODI, MENNIT, etc.) son CHAR de
    # ancho fijo en SQL Server, guardados con padding de espacios
    # (ej: "116201" -> "116201  "). Comparar con == falla si no se
    # recorta primero de los dos lados.
    return func.rtrim(func.ltrim(col))


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


# IMPORTANTE: esta ruta va SIEMPRE AL FINAL del archivo.
# "/{code}" es un comodin de un segmento: si se declara antes que las
# rutas literales de arriba (/total, /price, /portfolios, /by-portfolio),
# FastAPI matchea por orden de registro y "/total" terminaria entrando
# aca como code="total" en vez de llegar a get_procedures_total.
@router.get("/{code}")
def get_procedure_detail(
    code: str,
    session: Session = Depends(get_session_hosvital),
    _ = Depends(require_permission("procedures:view"))
):
    code = code.strip()

    # FIX: antes esto comparaba con == exacto contra un CHAR con padding
    # de espacios en la BD (ej. "116201" guardado como "116201  "), así
    # que nunca encontraba el procedimiento aunque existiera -> 404
    # aunque el código apareciera bien en el buscador (que usa ILIKE).
    procedure = session.exec(
        select(Procedure).where(_trimmed(Procedure.PRCODI) == code)
    ).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Procedimiento no encontrado")

    stmt = (
        select(PortfolioItem, Portfolio, Agreement, Tariff, ProcedurePrice)
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
        # FIX: mismo problema de padding, ahora en el join/filtro por código
        # dentro de PortfolioItem -> sin esto, aunque el procedimiento se
        # encontrara arriba, la lista de ofertas (convenios/portafolios/
        # precios) podía salir vacía.
        .where(_trimmed(PortfolioItem.PRCODI) == code)
        .where(PortfolioItem.PTIndExc == "N")
    )
    rows = session.exec(stmt).all()

    company_keys = list(set(
        effective_company_key(a.MEcntr, a.MENNIT) for _, _, a, _, _ in rows
    ))
    terceros_map = get_terceros_names(session, company_keys)

    offers = []
    for item, portfolio, agreement, tariff, price in rows:
        try:
            base = price.HomProVlr if price else 0
            final_price = round(base * item.PTPorc / 100, 2)
            contract_key = str(agreement.MENNIT).strip()
            company_key = effective_company_key(agreement.MEcntr, agreement.MENNIT)
            convenio_name = str(agreement.MENOMB).strip() if agreement.MENOMB else ""
            company_name = terceros_map.get(company_key) or convenio_name
            is_active = str(agreement.MEestado).strip() == "0"

            offers.append({
                "contract_key": contract_key,
                "convenio_name": convenio_name,
                "company_name": company_name,
                "portfolio_name": portfolio.PTDesc.strip(),
                "price": final_price,
                "is_active": is_active,
                "route": f"/convenios/{contract_key}?highlight={code}&portfolio={portfolio.PTCodi}",
            })
        except Exception as e:
            print(f"Error procesando oferta de {code} en convenio {agreement.MENNIT}: {e}")
            continue

    offers.sort(key=lambda o: (not o["is_active"], o["price"]))

    return {
        "code": str(procedure.PRCODI).strip(),
        "name": str(procedure.PrNomb).strip(),
        "total_offers": len(offers),
        "offers": offers,
    }