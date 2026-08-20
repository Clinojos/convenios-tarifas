from typing import Optional
from sqlmodel import Field, SQLModel

class Agreement(SQLModel, table=True):
    __tablename__ = "MAEEMP"   # tabla real en Hosvital, no se toca

    MENNIT: str = Field(primary_key=True)   # <-- este es tu contract_key
    MENOMB: str
    MEcntr: Optional[str] = None            # <-- este es el NIT (company_nit)
    MEestado: Optional[int] = None
    MEEps: Optional[int] = None
    MEFACTUR: Optional[str] = None
    MECApi: Optional[int] = None
    MEATope: Optional[float] = None
    MECOPA: Optional[str] = None
    MEobser: Optional[str] = None


class AgreementCard(SQLModel):
    contract_key: str          # = MENNIT (identificador único del convenio)
    company_nit: str           # = MEcntr (NIT, puede repetirse)
    name: str
    is_active: bool
    is_eps: bool
    modality: str               # "Capitado" | "Por Evento"
    logo_url: Optional[str] = None
    avatar_color: Optional[str] = None
    type: Optional[str] = None
    total_procedures: int = 0

