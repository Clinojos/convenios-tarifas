# app/services/search_engine.py
from sqlmodel import or_

def apply_search_filter(query, model, q: str):
    if not q:
        return query
    
    # Búsqueda para Empresas (Companies)
    if hasattr(model, "MENOMB") and hasattr(model, "MENNIT"):
        return query.where(
            or_(
                model.MENOMB.ilike(f"%{q}%"), 
                model.MENNIT.ilike(f"%{q}%")
            )
        )
    
    # Búsqueda para Procedimientos (Procedures)
    # Ajusta aquí los nombres exactos de tus campos en el modelo Procedure
    if hasattr(model, "PrNomb") and hasattr(model, "PRCODI"):
        return query.where(
            or_(
                model.PrNomb.ilike(f"%{q}%"), 
                model.PRCODI.ilike(f"%{q}%")
            )
        )
        
    return query