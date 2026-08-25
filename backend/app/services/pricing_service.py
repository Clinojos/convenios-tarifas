from sqlmodel import Session, select
from app.models.agreement_portfolio import AgreementPortfolio
from app.models.portfolio import Portfolio
from app.models.portfolio_item import PortfolioItem
from app.models.procedure import Procedure
from app.models.tariff import Tariff, ProcedurePrice


def get_procedure_price(session: Session, nit: str, proc_code: str):
    stmt = (
        select(PortfolioItem, ProcedurePrice, Tariff, Procedure, Portfolio)
        .join(Portfolio, Portfolio.PTCodi == PortfolioItem.PTCodi)
        .join(Tariff, Tariff.TrfCod == PortfolioItem.TrfCod)
        .join(
            ProcedurePrice,
            (ProcedurePrice.PRCODI == PortfolioItem.PRCODI)
            & (ProcedurePrice.TrfCod == PortfolioItem.TrfCod),
            isouter=True,
        )
        .join(Procedure, Procedure.PRCODI == PortfolioItem.PRCODI)
        .join(AgreementPortfolio, AgreementPortfolio.PTCodi == PortfolioItem.PTCodi)
        .where(AgreementPortfolio.MENNIT == nit)
        .where(PortfolioItem.PRCODI == proc_code)
        .where(PortfolioItem.PTIndExc == "N")
    )

    results = session.exec(stmt).all()

    output = []
    for item, price, tariff, proc, portfolio in results:
        base = price.HomProVlr if price else 0
        output.append({
            "proc_code": proc.PRCODI,
            "proc_name": proc.PrNomb,
            "portfolio_code": portfolio.PTCodi,
            "portfolio_name": portfolio.PTDesc,
            "tariff_code": tariff.TrfCod,
            "base_price": base,
            "percent": item.PTPorc,
            "final_price": base * item.PTPorc / 100,
            "requires_auth": item.PTReqAut == "S",
        })

    return output

from sqlmodel import func

def get_portfolios_by_contract(session: Session, nit: str):
    stmt = (
        select(Portfolio)
        .distinct()
        .join(AgreementPortfolio, AgreementPortfolio.PTCodi == Portfolio.PTCodi)
        .where(AgreementPortfolio.MENNIT == nit)
    )
    portfolios = session.exec(stmt).all()

    output = []
    for p in portfolios:
        count = session.exec(
            select(func.count())
            .select_from(PortfolioItem)
            .where(PortfolioItem.PTCodi == p.PTCodi)
            .where(PortfolioItem.PTIndExc == "N")
        ).one()
        output.append({
            "code": p.PTCodi,
            "name": p.PTDesc,
            "is_active": p.PTEst == "S",
            "total_procedures": count,
        })
    return output

def get_procedures_by_portfolio(
    session: Session,
    portfolio_code: str,
    q: str = None,
    page: int = 1,
    limit: int = 50,
):
    stmt = (
        select(PortfolioItem, ProcedurePrice, Tariff, Procedure)
        .join(Tariff, Tariff.TrfCod == PortfolioItem.TrfCod)
        .join(
            ProcedurePrice,
            (ProcedurePrice.PRCODI == PortfolioItem.PRCODI)
            & (ProcedurePrice.TrfCod == PortfolioItem.TrfCod),
            isouter=True,
        )
        .join(Procedure, Procedure.PRCODI == PortfolioItem.PRCODI)
        .where(PortfolioItem.PTCodi == portfolio_code)
        .where(PortfolioItem.PTIndExc == "N")
    )

    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Procedure.PrNomb.ilike(like)) | (Procedure.PRCODI.ilike(like))
        )

    # total antes de paginar
    total = session.exec(
        select(func.count()).select_from(stmt.subquery())
    ).one()

    offset = (page - 1) * limit
    results = session.exec(
        stmt.order_by(Procedure.PrNomb).offset(offset).limit(limit)
    ).all()

    output = []
    for item, price, tariff, proc in results:
        base = price.HomProVlr if price else 0
        output.append({
            "proc_code": proc.PRCODI.strip(),
            "proc_name": proc.PrNomb.strip(),
            "tariff_code": tariff.TrfCod,
            "tariff_name": (tariff.TrfDsc or "").strip(),
            "base_price": base,
            "percent": item.PTPorc,
            "final_price": round(base * item.PTPorc / 100, 2),
            "requires_auth": item.PTReqAut == "S",
        })

    return {"total": total, "page": page, "limit": limit, "data": output}