# services/db.py

from collections import defaultdict
from sqlmodel import select, Session
from models.company import Company

PLACEHOLDER_CONTRACTS = {"0000000000-0", "", None}

def get_company_groups(session: Session) -> list[dict]:
    companies = session.exec(select(Company)).all()

    groups: dict[str, list[Company]] = defaultdict(list)

    for c in companies:
        # Si el contrato es un placeholder (o vacío), cada compañía
        # se agrupa sola usando su propio NIT como key
        key = c.MEcntr if c.MEcntr not in PLACEHOLDER_CONTRACTS else c.MENNIT
        groups[key].append(c)

    result = []
    for key, items in groups.items():
        result.append({
            "group_key": key,
            "display_name": _pick_display_name(items),
            "total_variants": len(items),
            "variant_nits": [i.MENNIT for i in items],
        })

    return result


def _pick_display_name(items: list[Company]) -> str:
    """Elige el nombre más corto como representativo del grupo
    (suele ser el nombre 'base', sin sufijos EPS/PAC/CIRUGIA)."""
    return min((i.MENOMB for i in items), key=len)