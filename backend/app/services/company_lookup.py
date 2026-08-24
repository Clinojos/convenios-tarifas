from sqlmodel import Session

PLACEHOLDER_CONTRACTS = {"0000000000-0", "", None}


def effective_company_key(nit: str, contract_key: str) -> str:
    """Llave real para companies/TERCEROS. Si el NIT es placeholder/vacío,
    usa el contract_key como sustituto (mismo criterio que agreements.py)."""
    clean_nit = str(nit).strip() if nit is not None else ""
    if clean_nit in PLACEHOLDER_CONTRACTS:
        return str(contract_key).strip() if contract_key is not None else ""
    return clean_nit


def get_terceros_names(session: Session, keys: list[str]) -> dict[str, str]:
    """Trae razón social desde TERCEROS (Hosvital) por prefijo de NIT.
    Ver nota completa en agreements.py — mismo comportamiento, centralizado
    acá para que search.py y agreements.py no dupliquen la query."""
    from sqlalchemy import text

    keys = [k for k in set(keys) if k]
    if not keys:
        return {}

    conditions = " OR ".join(f"TrcNit LIKE :k{i}" for i in range(len(keys)))
    params = {f"k{i}": f"{k}%" for i, k in enumerate(keys)}

    try:
        rows = session.execute(
            text(f"SELECT TrcNit, TrcRazSoc, TrcRazSoT FROM TERCEROS WHERE {conditions}"),
            params,
        ).all()
    except Exception as e:
        print(f"No se pudo consultar TERCEROS: {e}")
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