from typing import Optional
from sqlmodel import Field, SQLModel

class PortfolioItem(SQLModel, table=True):
    __tablename__ = "PORTAR1"

    PTCodi: str = Field(primary_key=True)
    PRCODI: str = Field(primary_key=True)
    TrfCod: str
    PTPorc: float
    PTApCo: Optional[int] = None
    PTApMo: Optional[int] = None
    ForLiqCod: Optional[str] = None
    PTCntUvr: Optional[float] = None
    FctoCod: Optional[str] = None
    PTRecarg: Optional[str] = None
    PTPorRec: Optional[float] = None
    PTFacAgr: Optional[str] = None
    PTValLib: Optional[str] = None
    PTIndPaq: Optional[str] = None
    PTReqAut: Optional[str] = None
    PTIndExc: Optional[str] = None
    PtPesPro: Optional[int] = None
    PTObsPro: Optional[str] = None
    PTValSuS: Optional[float] = None
    PTCarApro: Optional[int] = None
    PTTipApro: Optional[str] = None
    PTEdMnT: Optional[int] = None
    PTEdaMax: Optional[int] = None