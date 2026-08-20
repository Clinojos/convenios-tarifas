# app/services/agreement_service.py
from sqlalchemy import text
from sqlmodel import Session, select
from ..db import engine
from ..database import get_session_local
from ..models.agreement_meta import AgreementMeta

def get_active_agreements(active_only: bool = True):
    with Session(engine) as session:
        query = text(f"""
            SELECT 
                RTRIM(MENNIT) as nit, 
                RTRIM(MENOMB) as name, 
                MEestado as status,
                CASE WHEN MEEps = 1 THEN 1 ELSE 0 END as is_eps,
                CASE WHEN RTRIM(MEFACTUR) = 'S' THEN 1 ELSE 0 END as can_invoice,
                RTRIM(MEcntr) as contract_number,
                ISNULL(MEATope, 0) as limit_amount,
                RTRIM(MEobser) as observations
            FROM dbo.MAEEMP 
            {"WHERE MEestado = 0" if active_only else ""}
            ORDER BY MENOMB ASC
        """)
        results = session.execute(query).fetchall()

        codes = [row.contract_number for row in results if row.contract_number]
        with next(get_session_local()) as local_session:
            metas = local_session.exec(
                select(AgreementMeta).where(AgreementMeta.company_code.in_(codes))
            ).all()
        meta_by_code = {m.company_code: m for m in metas}

        agreements = []
        for row in results:
            meta = meta_by_code.get(row.contract_number)
            agreements.append({
                "nit": row.nit,
                "name": row.name,
                "status": row.status,
                "is_active": row.status == 0,
                "is_eps": bool(row.is_eps),
                "can_invoice": bool(row.can_invoice),
                "contract_number": row.contract_number,
                "limit": float(row.limit_amount),
                "observations": row.observations,
                "logo_url": meta.logo_url if meta else None,
                "avatar_color": meta.avatar_color if meta else "#6B7280",
                "type": meta.type if meta else None,
            })
        return agreements