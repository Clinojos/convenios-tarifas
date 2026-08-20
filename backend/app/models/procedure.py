from typing import Optional
from sqlmodel import Field, SQLModel

class Procedure(SQLModel, table=True):
    __tablename__ = "MAEPRO"

    PRCODI: str = Field(primary_key=True)
    PrNomb: str
    PrNoOp: Optional[int] = None
    PlnCod: Optional[int] = None
    NivCod: Optional[int] = None
    PrAltCos: Optional[str] = None
    prtrmodo: Optional[str] = None
    IMPCOD: Optional[int] = None
    prcpto: Optional[str] = None
    prfinal: Optional[str] = None
    TpPrCd: Optional[int] = None
    PrMCCodi: Optional[str] = None
    PrTpo: Optional[str] = None
    FinProCod: Optional[str] = None
    PrSta: Optional[str] = None
    PrEdInc: Optional[int] = None
    PrEdFnl: Optional[int] = None
    PrSexo: Optional[str] = None
    PrAtnDom: Optional[str] = None    # atención domiciliaria 'S'/'N'
    PrConSN: Optional[str] = None     # requiere autorización 'S'/'N'