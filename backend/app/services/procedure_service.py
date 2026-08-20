from sqlalchemy import text
from sqlmodel import Session
from ..db import engine

def get_active_procedures():
    with Session(engine) as session:
        # Usamos SQL puro para limpiar los datos y formatear las reglas de negocio
        query = text("""
            SELECT 
                RTRIM(PRCODI) as code, 
                RTRIM(PrNomb) as name, 
                RTRIM(PrSta) as status,
                RTRIM(PrSexo) as gender_restriction,
                ISNULL(PrEdInc, 0) as min_age,
                ISNULL(PrEdFnl, 0) as max_age,
                CASE WHEN RTRIM(PrAtnDom) = 'S' THEN 1 ELSE 0 END as home_care,
                CASE WHEN RTRIM(PrConSN) = 'S' THEN 1 ELSE 0 END as requires_consultation
            FROM dbo.MAEPRO
            WHERE RTRIM(PrSta) = 'A'
            ORDER BY PrNomb ASC
        """)
        
        results = session.execute(query).fetchall()
        
        # Mapeamos a una lista de diccionarios (limpia y directa para el frontend)
        procedures = [
            {
                "code": row.code,
                "name": row.name,
                "status": row.status,
                "gender_restriction": row.gender_restriction,
                "min_age": int(row.min_age),
                "max_age": int(row.max_age),
                "home_care": bool(row.home_care),
                "requires_consultation": bool(row.requires_consultation)
            }
            for row in results
        ]
        return procedures