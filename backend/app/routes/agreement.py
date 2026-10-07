from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from sqlalchemy import text

from ..db import get_session_hosvital, get_session_local
from app.models.agreement import Agreement
from app.models.agreement_visit import AgreementVisit
from app.auth.jwt import get_current_user
from app.services.search_engine import apply_search_filter

router = APIRouter(prefix="/api/v1/agreements", tags=["Agreements"])

PLACEHOLDER_CONTRACTS = {"0000000000-0", "", None}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_group_key(nit: str) -> str:
    """Agrupa por NIT. Si el NIT es un placeholder/vacío, se usa el
    MENNIT (contract_key) del propio registro como key, para que
    quede como su propio grupo en vez de mezclarse con otros placeholders."""
    clean = str(nit).strip() if nit is not None else ""
    if clean in PLACEHOLDER_CONTRACTS:
        return None  # el caller decide el fallback (MENNIT), ver list_agreement_groups
    return clean


def _effective_company_key(nit: Optional[str], contract_key: Optional[str]) -> str:
    """Llave real de empresa. Si el NIT (MEcntr) es válido, se usa tal
    cual. Si es placeholder/vacío, se usa el contract_key (MENNIT)."""
    clean_nit = str(nit).strip() if nit is not None else ""
    if clean_nit in PLACEHOLDER_CONTRACTS:
        return str(contract_key).strip() if contract_key is not None else ""
    return clean_nit


def _count_procedures(codes: list[str]) -> dict[str, int]:
    """
    TODO: reemplaza esto por tu query real contra la tabla de tarifas
    (ej. MAETAR / TARIFAS en Hosvital), agrupando por MENNIT,
    y devolviendo {contract_key: total_procedimientos}.
    """
    return {code: 0 for code in codes}


def _agreement_keys(agreements: list[Agreement]) -> list[str]:
    return [str(a.MENNIT).strip() for a in agreements if a.MENNIT is not None]


def _get_terceros_names(session: Session, keys: list[str]) -> dict[str, str]:
    """Trae la razón social desde TERCEROS (Hosvital) para las llaves de
    EMPRESA (NIT) dadas.

    El TrcNit en TERCEROS suele traer el dígito de verificación
    (ej. '890903938-8'), mientras que la llave de empresa que manejamos acá
    (MEcntr) puede venir sin él (ej. '890903938'). Por eso el match es por
    prefijo (LIKE 'key%') en vez de igualdad exacta.
    """
    keys = [k for k in set(keys) if k]
    if not keys:
        return {}

    conditions = " OR ".join(f"TrcNit LIKE :k{i}" for i in range(len(keys)))
    params = {f"k{i}": f"{k}%" for i, k in enumerate(keys)}

    try:
        rows = session.execute(
            text(f"""
                SELECT TrcNit, TrcRazSoc, TrcRazSoT
                FROM TERCEROS
                WHERE {conditions}
            """),
            params,
        ).all()
    except Exception as e:
        print(f"No se pudo consultar TERCEROS para nombres de empresa: {e}")
        return {}

    result: dict[str, str] = {}
    for trc_nit, razon_social, razon_social_t in rows:
        name = (str(razon_social).strip() if razon_social else "") or \
               (str(razon_social_t).strip() if razon_social_t else "")
        if not name:
            continue
        clean_nit = str(trc_nit).strip()
        for key in keys:
            if key and clean_nit.startswith(key) and key not in result:
                result[key] = name
    return result


def _modality_label(agreement: Agreement) -> str:
    """'Capitado' vs 'Por Evento'. Usa MECApi del modelo Agreement."""
    is_capitado = str(getattr(agreement, "MECApi", "") or "").strip() in ("1", "S")
    return "Capitado" if is_capitado else "Por Evento"


def _serialize_agreement(agreement: Agreement, total_procedures: int) -> dict:
    # MEestado: '0' = Activo, '1' = Inactivo (invertido respecto a la
    # convención habitual de "1 = activo"; confirmado contra datos reales).
    return {
        "contract_key": str(agreement.MENNIT).strip() if agreement.MENNIT is not None else "",
        "company_nit": str(agreement.MEcntr).strip() if agreement.MEcntr is not None else "",
        "name": str(agreement.MENOMB).strip() if agreement.MENOMB is not None else "",
        "status": "Activo" if str(agreement.MEestado).strip() == '0' else "Inactivo",
        "is_active": str(agreement.MEestado).strip() == '0',
        "is_eps": str(agreement.MEEps).strip() == 'S' if agreement.MEEps is not None else False,
        "can_invoice": str(agreement.MEFACTUR).strip() == 'S' if agreement.MEFACTUR is not None else False,
        "limit": float(getattr(agreement, "MEATope", 0) or 0),
        "applies_copay": str(getattr(agreement, "MECOPA", "") or "").strip() == 'S',
        "observations": str(getattr(agreement, "MEobser", "") or "").strip(),
        "modality": _modality_label(agreement),
        "total_procedures": total_procedures,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/")
def list_agreements(
    session: Session = Depends(get_session_hosvital),
    page: int = 1,
    limit: int = 50,
    q: str = None,
    status: str = None,
    _current_user: dict = Depends(get_current_user),
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()

    offset = (page - 1) * limit
    results = session.exec(
        query.order_by(Agreement.MENNIT).offset(offset).limit(limit)
    ).all()

    keys = _agreement_keys(results)
    procedures_map = _count_procedures(keys)

    output = []
    for agreement in results:
        try:
            key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else ""
            proc_count = procedures_map.get(key, 0)
            output.append(_serialize_agreement(agreement, proc_count))
        except Exception as e:
            print(f"Registro corrupto ignorado (MENNIT: {agreement.MENNIT}): {e}")
            continue

    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "data": output
    }


@router.get("/total")
def get_agreements_total(
    session: Session = Depends(get_session_hosvital),
    q: str = None,
    status: str = None,
    _current_user: dict = Depends(get_current_user),
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()
    return {"total": total_records}


# IMPORTANTE: "/groups/total" va ANTES de "/groups/{group_key}". Si no,
# FastAPI matchea "total" como group_key.
@router.get("/groups/total")
def get_agreement_groups_total(
    session: Session = Depends(get_session_hosvital),
    q: str = None,
    status: str = None,
    _current_user: dict = Depends(get_current_user),
):
    """Cantidad de grupos (empresas) con la misma lógica de agrupación de
    /groups, para que el número del dashboard coincida con lo que lista
    la página /convenios."""
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    agreements = session.exec(query).all()

    keys = set()
    for agreement in agreements:
        try:
            nit = str(agreement.MEcntr).strip() if agreement.MEcntr is not None else ""
            key = _get_group_key(nit)
            if key is None:
                key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else nit
            keys.add(key)
        except Exception as e:
            print(f"Registro corrupto ignorado al contar grupos (NIT: {agreement.MEcntr}): {e}")
            continue

    return {"total": len(keys)}


@router.get("/groups")
def list_agreement_groups(
    session: Session = Depends(get_session_hosvital),
    q: str = None,
    status: str = None,
    page: int = 1,
    limit: int = 12,
    _current_user: dict = Depends(get_current_user),
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    agreements = session.exec(query).all()
    q_lower = q.strip().lower() if q else None

    # --- Paso 1: agrupar por empresa (en memoria) ---
    groups: dict[str, list[Agreement]] = {}
    for agreement in agreements:
        try:
            nit = str(agreement.MEcntr).strip() if agreement.MEcntr is not None else ""
            key = _get_group_key(nit)
            if key is None:
                key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else nit
            groups.setdefault(key, []).append(agreement)
        except Exception as e:
            print(f"Registro corrupto ignorado al agrupar (NIT: {agreement.MEcntr}): {e}")
            continue

    # --- Paso 2: cabeceras de grupo ---
    headers = []
    for key, items in groups.items():
        fallback_name = min(
            (str(a.MENOMB).strip() for a in items if a.MENOMB is not None),
            key=len,
            default=""
        )
        active_variants = sum(1 for a in items if str(a.MEestado).strip() == '0')
        headers.append({
            "key": key,
            "items": items,
            "fallback_name": fallback_name,
            "active_variants": active_variants,
        })

    # --- Paso 2.5: ordenar por razón social real (TERCEROS) ---
    all_company_keys = list({
        _effective_company_key(h["items"][0].MEcntr, h["items"][0].MENNIT)
        for h in headers
    })
    sort_names_map = _get_terceros_names(session, all_company_keys)

    for h in headers:
        company_key = _effective_company_key(h["items"][0].MEcntr, h["items"][0].MENNIT)
        h["company_key"] = company_key
        h["sort_name"] = sort_names_map.get(company_key) or h["fallback_name"]

    headers.sort(key=lambda h: h["sort_name"].lower())

    total_groups = len(headers)
    offset = (page - 1) * limit
    page_headers = headers[offset: offset + limit]

    page_keys = [
        str(a.MENNIT).strip()
        for h in page_headers for a in h["items"] if a.MENNIT is not None
    ]
    procedures_map = _count_procedures(page_keys)

    output = []
    for h in page_headers:
        items = h["items"]
        key = h["key"]
        any_active = h["active_variants"] > 0
        first = items[0]
        total_procedures = sum(procedures_map.get(str(a.MENNIT).strip(), 0) for a in items)
        display_name = h["sort_name"]

        matched_variants = []
        if q_lower:
            for a in items:
                variant_name = str(a.MENOMB).strip() if a.MENOMB is not None else ""
                variant_key = str(a.MENNIT).strip() if a.MENNIT is not None else ""
                name_match = q_lower in variant_name.lower() and variant_name.lower() != display_name.lower()
                key_match = q_lower in variant_key.lower()
                if name_match or key_match:
                    matched_variants.append({
                        "contract_key": variant_key,
                        "name": variant_name,
                    })

        output.append({
            "group_key": key,
            "display_name": display_name,
            "matched_variants": matched_variants,
            "status": "Activo" if any_active else "Inactivo",
            "active_variants": h["active_variants"],
            "total_variants": len(items),
            "variant_keys": [str(a.MENNIT).strip() for a in items],
            "modality": _modality_label(first),
            "total_procedures": total_procedures,
        })

    return {
        "total": total_groups,
        "page": page,
        "limit": limit,
        "data": output,
    }


@router.get("/groups/{group_key}")
def get_agreement_group_variants(
    group_key: str,
    session: Session = Depends(get_session_hosvital),
    _current_user: dict = Depends(get_current_user),
):
    group_key = group_key.strip()

    query = select(Agreement).where(
        (func.trim(Agreement.MEcntr) == group_key) |
        (func.trim(Agreement.MENNIT) == group_key)
    )
    agreements = session.exec(query).all()

    if not agreements:
        raise HTTPException(status_code=404, detail="Empresa o convenio no encontrado")

    keys = _agreement_keys(agreements)
    procedures_map = _count_procedures(keys)
    company_keys = list({
        _effective_company_key(a.MEcntr, a.MENNIT) for a in agreements
    })
    terceros_map = _get_terceros_names(session, company_keys)

    output = []
    company_name = None
    for agreement in agreements:
        try:
            key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else ""
            company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
            if company_name is None:
                company_name = terceros_map.get(company_key)
            output.append({
                "contract_key": key,
                "name": str(agreement.MENOMB).strip() if agreement.MENOMB is not None else "",
                "status": "Activo" if str(agreement.MEestado).strip() == '0' else "Inactivo",
                "company_nit": str(agreement.MEcntr).strip() if agreement.MEcntr is not None else "",
                "modality": _modality_label(agreement),
                "total_procedures": procedures_map.get(key, 0),
            })
        except Exception as e:
            print(f"Registro corrupto ignorado (MENNIT: {agreement.MENNIT}): {e}")
            continue

    if not company_name:
        company_name = min(
            (str(a.MENOMB).strip() for a in agreements if a.MENOMB is not None),
            key=len,
            default=""
        )

    return {
        "total": len(output),
        "company_name": company_name,
        "data": output
    }


# ---------------------------------------------------------------------------
# Detalle de UN convenio (toda su info viene de Hosvital, incluida MEobser)
# ---------------------------------------------------------------------------

@router.get("/{contract_key}/detail")
def get_agreement_detail(
    contract_key: str,
    session: Session = Depends(get_session_hosvital),
    _current_user: dict = Depends(get_current_user),
):
    agreement = session.exec(
        select(Agreement).where(Agreement.MENNIT == contract_key)
    ).first()

    if not agreement:
        raise HTTPException(status_code=404, detail="Convenio no encontrado en Hosvital")

    company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
    company_name = None
    if company_key:
        terceros_map = _get_terceros_names(session, [company_key])
        company_name = terceros_map.get(company_key)

    base = _serialize_agreement(agreement, total_procedures=0)

    return {
        **base,
        "company_name": company_name,
    }


# ---------------------------------------------------------------------------
# Tracking de visitas — "Convenios más consultados" del dashboard
# ---------------------------------------------------------------------------

@router.post("/{contract_key}/visit")
def register_agreement_visit(
    contract_key: str,
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    _current_user: dict = Depends(get_current_user),
):
    agreement = session.exec(
        select(Agreement).where(Agreement.MENNIT == contract_key)
    ).first()

    company_nit = _effective_company_key(agreement.MEcntr, agreement.MENNIT) if agreement else None

    local_session.add(AgreementVisit(contract_key=contract_key, company_nit=company_nit))
    local_session.commit()

    return {"ok": True}


@router.get("/top-consultadas")
def get_top_consulted_companies(
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    limit: int = 5,
    _current_user: dict = Depends(get_current_user),
):
    rows = local_session.exec(
        select(AgreementVisit.contract_key, func.count().label("visits"))
        .group_by(AgreementVisit.contract_key)
        .order_by(func.count().desc())
        .limit(limit)
    ).all()

    ordered_keys = [r[0] for r in rows]
    visits_map = {r[0]: r[1] for r in rows}
    if not ordered_keys:
        return {"data": []}

    agreements = session.exec(
        select(Agreement).where(Agreement.MENNIT.in_(ordered_keys))
    ).all()
    agreements_map = {str(a.MENNIT).strip(): a for a in agreements}

    company_keys = list({
        _effective_company_key(a.MEcntr, a.MENNIT) for a in agreements
    })
    terceros_map = _get_terceros_names(session, company_keys)

    output = []
    for key in ordered_keys:
        agreement = agreements_map.get(key)
        if not agreement:
            continue
        company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
        output.append({
            "group_key": key,
            "display_name": str(agreement.MENOMB).strip() if agreement.MENOMB else key,
            "company_name": terceros_map.get(company_key),
            "is_active": str(agreement.MEestado).strip() == '0',
            "visits": visits_map.get(key, 0),
            "type": None,
        })

    return {"data": output}