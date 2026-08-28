from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from sqlalchemy import delete, text
from pydantic import BaseModel

from ..db import get_session_hosvital, get_session_local
from app.models.agreement import Agreement
from app.models.agreement_meta import AgreementMeta, Company
from app.models.agreement_details import AgreementDetails
from app.models.agreement_documents import AgreementDocument
from app.models.agreement_contacts import AgreementContact
from app.models.agreement_visit import AgreementVisit
from app.auth.permissions import require_permission
from app.services.search_engine import apply_search_filter

router = APIRouter(prefix="/api/v1/agreements", tags=["Agreements"])

PLACEHOLDER_CONTRACTS = {"0000000000-0", "", None}

DEFAULT_AVATAR_COLOR = "#6B7280"


# ---------------------------------------------------------------------------
# Schemas de edición (para el PUT del detalle)
# ---------------------------------------------------------------------------

class ContactIn(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class DocumentIn(BaseModel):
    description: str


class AgreementDetailUpdate(BaseModel):
    # entidad (companies)
    logo_url: Optional[str] = None
    avatar_color: Optional[str] = None

    # entidad (agreement_meta)
    address: Optional[str] = None
    phone: Optional[str] = None
    habilitation_code: Optional[str] = None

    # contrato (agreement_details)
    contracted_services: Optional[str] = None
    invoice_filing: Optional[str] = None
    copayment_collection: Optional[str] = None
    start_date: Optional[str] = None
    last_rate_increase: Optional[str] = None
    expiration_date: Optional[str] = None
    auto_renewal: Optional[str] = None
    authorization_instructions: Optional[str] = None
    radication_documents: Optional[str] = None

    # listas
    required_documents: Optional[List[DocumentIn]] = None
    contacts: Optional[List[ContactIn]] = None

    # secciones ocultas para este convenio: ["contrato", "autorizacion", ...]
    hidden_sections: Optional[List[str]] = None


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
    """Llave real para la tabla companies. Si el NIT (MEcntr) es válido, se usa
    tal cual. Si es placeholder/vacío, se usa el contract_key (MENNIT) del
    propio convenio como sustituto — así el logo siempre tiene dónde guardarse,
    incluso en convenios sin NIT real asignado."""
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
    """Llaves de contrato (MENNIT) — usado para cruzar con la metadata local."""
    return [str(a.MENNIT).strip() for a in agreements if a.MENNIT is not None]


def _agreement_company_keys(agreements: list[Agreement]) -> list[str]:
    """Llaves efectivas para companies (MEcntr, con fallback a MENNIT)."""
    return [
        _effective_company_key(a.MEcntr, a.MENNIT)
        for a in agreements
        if a.MENNIT is not None
    ]


def _get_meta_map(local_session: Session, keys: list[str]) -> dict[str, AgreementMeta]:
    """Trae la metadata local (address, phone, habilitation_code) para un
    conjunto de contract_key. No escribe nada."""
    keys = [k for k in keys if k]
    if not keys:
        return {}
    metas = local_session.exec(
        select(AgreementMeta).where(AgreementMeta.contract_key.in_(keys))
    ).all()
    return {m.contract_key: m for m in metas}


def _get_company_map(local_session: Session, keys: list[str]) -> dict[str, Company]:
    """Trae logo_url/avatar_color por llave efectiva (company_nit o, en su
    defecto, contract_key) desde la tabla companies. No escribe nada."""
    keys = [k for k in keys if k]
    if not keys:
        return {}
    companies = local_session.exec(
        select(Company).where(Company.company_nit.in_(keys))
    ).all()
    return {c.company_nit: c for c in companies}


def _get_terceros_names(session: Session, keys: list[str]) -> dict[str, str]:
    """Trae la razón social desde TERCEROS (Hosvital) para las llaves de
    EMPRESA (NIT) dadas.

    Se usa ÚNICAMENTE para el nombre que se muestra en las tarjetas de
    EMPRESA (agrupado por NIT, endpoint /groups). El nombre del convenio
    individual (dentro del grupo, /groups/{group_key}) sigue usando MENOMB
    y NO pasa por aquí.

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


def _serialize_agreement(
    agreement: Agreement,
    total_procedures: int,
    meta: Optional[AgreementMeta] = None,
    company: Optional[Company] = None,
) -> dict:
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
        "logo_url": company.logo_url if company else None,
        "avatar_color": company.avatar_color if company else DEFAULT_AVATAR_COLOR,
        "type": None,  # columna no existe todavía en agreement_meta
        "total_procedures": total_procedures,
    }


def _hidden_sections_to_list(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]


def _hidden_sections_to_str(sections: Optional[List[str]]) -> str:
    if not sections:
        return ""
    return ",".join(sorted(set(s.strip() for s in sections if s.strip())))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/")
def list_agreements(
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    page: int = 1,
    limit: int = 50,
    q: str = None,
    status: str = None,
    _ = Depends(require_permission("agreement:view"))
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        # MEestado: '0' = Activo, '1' = Inactivo (invertido).
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()

    offset = (page - 1) * limit
    results = session.exec(
        query.order_by(Agreement.MENNIT).offset(offset).limit(limit)
    ).all()

    keys = _agreement_keys(results)
    company_keys = _agreement_company_keys(results)
    procedures_map = _count_procedures(keys)
    meta_map = _get_meta_map(local_session, keys)
    company_map = _get_company_map(local_session, company_keys)

    output = []
    for agreement in results:
        try:
            key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else ""
            company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
            proc_count = procedures_map.get(key, 0)
            meta = meta_map.get(key)
            company = company_map.get(company_key)
            output.append(_serialize_agreement(agreement, proc_count, meta, company))
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
    _ = Depends(require_permission("agreement:view"))
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        # MEestado: '0' = Activo, '1' = Inactivo (invertido).
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    total_records = session.exec(select(func.count()).select_from(query.subquery())).one()
    return {"total": total_records}

@router.get("/groups")
def list_agreement_groups(
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    q: str = None,
    status: str = None,
    page: int = 1,
    limit: int = 12,
    _ = Depends(require_permission("agreement:view"))
):
    query = select(Agreement).where(Agreement.MENNIT.isnot(None))
    query = apply_search_filter(query, Agreement, q)

    if status:
        val_estado = '0' if status == 'active' else '1'
        query = query.where(Agreement.MEestado == val_estado)

    agreements = session.exec(query).all()

    # término normalizado para comparar contra display_name / NIT más abajo
    q_lower = q.strip().lower() if q else None

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

    all_keys = list({str(a.MENNIT).strip() for items in groups.values() for a in items if a.MENNIT is not None})
    all_company_keys = list({
        _effective_company_key(a.MEcntr, a.MENNIT)
        for items in groups.values() for a in items if a.MENNIT is not None
    })
    procedures_map = _count_procedures(all_keys)
    meta_map = _get_meta_map(local_session, all_keys)
    company_map = _get_company_map(local_session, all_company_keys)
    terceros_map = _get_terceros_names(session, all_company_keys)

    output = []
    for key, items in groups.items():
        fallback_name = min(
            (str(a.MENOMB).strip() for a in items if a.MENOMB is not None),
            key=len,
            default=""
        )
        active_variants = sum(1 for a in items if str(a.MEestado).strip() == '0')
        any_active = active_variants > 0

        first = items[0]
        total_procedures = sum(procedures_map.get(str(a.MENNIT).strip(), 0) for a in items)

        group_company_key = _effective_company_key(first.MEcntr, first.MENNIT)
        group_company = company_map.get(group_company_key)

        display_name = terceros_map.get(group_company_key) or fallback_name

        # Si hubo búsqueda y el término NO aparece en el nombre de la
        # empresa ni en su NIT, el match tuvo que venir de una variante
        # interna (apply_search_filter ya filtró por MENOMB/MENNIT de cada
        # Agreement). Buscamos cuál variante fue la que matcheó, para que
        # el frontend pueda mostrar el chip "Coincidencia interna: X".
        matched_variant_names = []
        if q_lower:
            for a in items:
                variant_name = str(a.MENOMB).strip() if a.MENOMB is not None else ""
                if q_lower in variant_name.lower() and variant_name.lower() != display_name.lower():
                    matched_variant_names.append(variant_name)

        output.append({
            "group_key": key,
            "display_name": display_name,
            "matched_variant_names": matched_variant_names,
            "status": "Activo" if any_active else "Inactivo",
            "active_variants": active_variants,
            "total_variants": len(items),
            "variant_keys": [str(a.MENNIT).strip() for a in items],
            "modality": _modality_label(first),
            "logo_url": group_company.logo_url if group_company else None,
            "avatar_color": group_company.avatar_color if group_company else DEFAULT_AVATAR_COLOR,
            "type": None,
            "total_procedures": total_procedures,
        })

    output.sort(key=lambda g: g["display_name"])

    total_groups = len(output)
    offset = (page - 1) * limit
    paginated_output = output[offset: offset + limit]

    return {
        "total": total_groups,
        "page": page,
        "limit": limit,
        "data": paginated_output,
    }

@router.get("/groups/{group_key}")
def get_agreement_group_variants(
    group_key: str,
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    _ = Depends(require_permission("agreement:view"))
):
    # NOTA: acá el "name" de cada tarjeta sigue siendo el del CONVENIO
    # (MENOMB, vía _serialize_agreement / lógica de abajo), no el de la
    # empresa. Esto es intencional: dentro de un grupo, cada variante es un
    # convenio distinto y debe mostrar su propio nombre de convenio.
    query = select(Agreement).where(
        (Agreement.MEcntr == group_key) | (Agreement.MENNIT == group_key)
    )
    agreements = session.exec(query).all()

    keys = _agreement_keys(agreements)
    company_keys = _agreement_company_keys(agreements)
    procedures_map = _count_procedures(keys)
    meta_map = _get_meta_map(local_session, keys)
    company_map = _get_company_map(local_session, company_keys)
    # Nombre real de la empresa (razón social) desde TERCEROS, para el
    # encabezado (H1) de esta pantalla. Cada tarjeta de variante sigue
    # usando "name" = MENOMB (nombre del convenio), sin cambios.
    terceros_map = _get_terceros_names(session, company_keys)

    output = []
    company_name = None
    for agreement in agreements:
        try:
            key = str(agreement.MENNIT).strip() if agreement.MENNIT is not None else ""
            company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
            if company_name is None:
                company_name = terceros_map.get(company_key)
            meta = meta_map.get(key)
            company = company_map.get(company_key)
            output.append({
                "contract_key": key,
                "name": str(agreement.MENOMB).strip() if agreement.MENOMB is not None else "",
                # MEestado: '0' = Activo, '1' = Inactivo (invertido).
                "status": "Activo" if str(agreement.MEestado).strip() == '0' else "Inactivo",
                "company_nit": str(agreement.MEcntr).strip() if agreement.MEcntr is not None else "",
                "modality": _modality_label(agreement),
                "logo_url": company.logo_url if company else None,
                "avatar_color": company.avatar_color if company else DEFAULT_AVATAR_COLOR,
                "type": None,
                "total_procedures": procedures_map.get(key, 0),
            })
        except Exception as e:
            print(f"Registro corrupto ignorado (MENNIT: {agreement.MENNIT}): {e}")
            continue

    # Si TERCEROS no tiene la empresa, caemos al nombre de convenio más
    # corto entre las variantes (mismo criterio que usa /groups).
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
# Detalle completo de UN convenio
# ---------------------------------------------------------------------------

@router.get("/{contract_key}/detail")
def get_agreement_detail(
    contract_key: str,
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    _ = Depends(require_permission("agreement:view"))
):
    agreement = session.exec(
        select(Agreement).where(Agreement.MENNIT == contract_key)
    ).first()

    if not agreement:
        raise HTTPException(status_code=404, detail="Convenio no encontrado en Hosvital")

    meta = local_session.exec(
        select(AgreementMeta).where(AgreementMeta.contract_key == contract_key)
    ).first()

    company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
    company = local_session.exec(
        select(Company).where(Company.company_nit == company_key)
    ).first() if company_key else None

    # NUEVO: nombre real de la empresa matriz (razón social) desde TERCEROS,
    # mismo criterio que /groups y /groups/{group_key}.
    company_name = None
    if company_key:
        terceros_map = _get_terceros_names(session, [company_key])
        company_name = terceros_map.get(company_key)

    details = local_session.exec(
        select(AgreementDetails).where(AgreementDetails.contract_key == contract_key)
    ).first()

    documents = local_session.exec(
        select(AgreementDocument)
        .where(AgreementDocument.contract_key == contract_key)
        .order_by(AgreementDocument.sort_order)
    ).all()

    contacts = local_session.exec(
        select(AgreementContact)
        .where(AgreementContact.contract_key == contract_key)
        .order_by(AgreementContact.sort_order)
    ).all()

    base = _serialize_agreement(agreement, total_procedures=0, meta=meta, company=company)

    return {
        **base,
        "company_name": company_name,  # NUEVO
        # entidad
        "address": meta.address if meta else None,
        "phone": meta.phone if meta else None,
        "habilitation_code": meta.habilitation_code if meta else None,
        # contrato
        "contracted_services": details.contracted_services if details else None,
        "invoice_filing": details.invoice_filing if details else None,
        "copayment_collection": details.copayment_collection if details else None,
        "start_date": details.start_date if details else None,
        "last_rate_increase": details.last_rate_increase if details else None,
        "expiration_date": details.expiration_date if details else None,
        "auto_renewal": details.auto_renewal if details else None,
        "authorization_instructions": details.authorization_instructions if details else None,
        "radication_documents": details.radication_documents if details else None,
        "hidden_sections": _hidden_sections_to_list(details.hidden_sections if details else None),
        # listas
        "required_documents": [
            {"order": d.sort_order, "description": d.description} for d in documents
        ],
        "contacts": [
            {
                "full_name": c.full_name,
                "role": c.role,
                "address": c.address,
                "phone": c.phone,
                "email": c.email,
            }
            for c in contacts
        ],
    }


# ---------------------------------------------------------------------------
# Editar detalle local de UN convenio
# ---------------------------------------------------------------------------

@router.put("/{contract_key}/detail")
def update_agreement_detail(
    contract_key: str,
    payload: AgreementDetailUpdate,
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    _ = Depends(require_permission("agreement:edit"))
):
    agreement = session.exec(
        select(Agreement).where(Agreement.MENNIT == contract_key)
    ).first()
    if not agreement:
        raise HTTPException(status_code=404, detail="Convenio no encontrado en Hosvital")

    company_nit = str(agreement.MEcntr).strip() if agreement.MEcntr is not None else ""
    company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)

    # --- upsert agreement_meta ---
    meta = local_session.exec(
        select(AgreementMeta).where(AgreementMeta.contract_key == contract_key)
    ).first()
    if meta is None:
        meta = AgreementMeta(contract_key=contract_key, company_nit=company_nit)
        local_session.add(meta)
    if payload.address is not None:
        meta.address = payload.address
    if payload.phone is not None:
        meta.phone = payload.phone
    if payload.habilitation_code is not None:
        meta.habilitation_code = payload.habilitation_code

    # --- upsert companies (logo_url / avatar_color viven aquí ahora) ---
    # company_key siempre tiene un valor: el NIT real si existe, o el
    # contract_key como sustituto cuando el convenio no tiene NIT asignado.
    #
    # FIX: antes esto solo se ejecutaba si el payload traía logo_url o
    # avatar_color, pero el frontend nunca manda esos campos al editar
    # (no hay input de logo en el form todavía). Resultado: la fila en
    # companies nunca se creaba, aunque editaras todo lo demás del
    # convenio. Ahora se garantiza que la fila exista siempre que haya
    # company_key, quedando lista (con logo_url=NULL) para cuando se
    # cargue el logo después.
    if company_key:
        company = local_session.exec(
            select(Company).where(Company.company_nit == company_key)
        ).first()
        if company is None:
            company = Company(company_nit=company_key)
            local_session.add(company)
        if payload.logo_url is not None:
            company.logo_url = payload.logo_url
        if payload.avatar_color is not None:
            company.avatar_color = payload.avatar_color

    # --- upsert agreement_details ---
    details = local_session.exec(
        select(AgreementDetails).where(AgreementDetails.contract_key == contract_key)
    ).first()
    if details is None:
        details = AgreementDetails(contract_key=contract_key)
        local_session.add(details)
    if payload.contracted_services is not None:
        details.contracted_services = payload.contracted_services
    if payload.invoice_filing is not None:
        details.invoice_filing = payload.invoice_filing
    if payload.copayment_collection is not None:
        details.copayment_collection = payload.copayment_collection
    if payload.start_date is not None:
        details.start_date = payload.start_date
    if payload.last_rate_increase is not None:
        details.last_rate_increase = payload.last_rate_increase
    if payload.expiration_date is not None:
        details.expiration_date = payload.expiration_date
    if payload.auto_renewal is not None:
        details.auto_renewal = payload.auto_renewal
    if payload.authorization_instructions is not None:
        details.authorization_instructions = payload.authorization_instructions
    if payload.radication_documents is not None:
        details.radication_documents = payload.radication_documents
    if payload.hidden_sections is not None:
        details.hidden_sections = _hidden_sections_to_str(payload.hidden_sections)

    # --- reemplazar agreement_documents ---
    if payload.required_documents is not None:
        local_session.exec(
            delete(AgreementDocument).where(AgreementDocument.contract_key == contract_key)
        )
        for i, doc in enumerate(payload.required_documents):
            local_session.add(
                AgreementDocument(
                    contract_key=contract_key,
                    sort_order=i,
                    description=doc.description,
                )
            )

    # --- reemplazar agreement_contacts ---
    if payload.contacts is not None:
        local_session.exec(
            delete(AgreementContact).where(AgreementContact.contract_key == contract_key)
        )
        for i, c in enumerate(payload.contacts):
            local_session.add(
                AgreementContact(
                    contract_key=contract_key,
                    sort_order=i,
                    full_name=c.full_name,
                    role=c.role,
                    address=c.address,
                    phone=c.phone,
                    email=c.email,
                )
            )

    local_session.commit()

    return get_agreement_detail(
        contract_key=contract_key,
        session=session,
        local_session=local_session,
        _=None,
    )

# ---------------------------------------------------------------------------
# Tracking de visitas — "Convenios más consultados" del dashboard
# ---------------------------------------------------------------------------

@router.post("/{contract_key}/visit")
def register_agreement_visit(
    contract_key: str,
    session: Session = Depends(get_session_hosvital),
    local_session: Session = Depends(get_session_local),
    _ = Depends(require_permission("agreement:view"))
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
    _ = Depends(require_permission("agreement:view"))
):
    # Ahora agrupamos por CONVENIO (contract_key), no por empresa,
    # para que "BANCO" y "BANCO1" (ambos de Bancolombia) salgan
    # como tarjetas separadas en vez de una sola.
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

    # Nombre de la empresa matriz (para mostrarlo como subtítulo/contexto,
    # ej. "Bancolombia S.A." debajo del nombre del convenio "BANCO").
    company_keys = list({
        _effective_company_key(a.MEcntr, a.MENNIT) for a in agreements
    })
    terceros_map = _get_terceros_names(session, company_keys)

    output = []
    for key in ordered_keys:
        agreement = agreements_map.get(key)
        if not agreement:
            # convenio visitado que ya no existe en Hosvital
            continue
        company_key = _effective_company_key(agreement.MEcntr, agreement.MENNIT)
        output.append({
            "group_key": key,  # ahora es el contract_key del convenio
            "display_name": str(agreement.MENOMB).strip() if agreement.MENOMB else key,
            "company_name": terceros_map.get(company_key),
            "is_active": str(agreement.MEestado).strip() == '0',
            "visits": visits_map.get(key, 0),
            "type": None,
        })

    return {"data": output}