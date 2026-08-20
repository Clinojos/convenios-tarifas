from typing import Optional
from sqlmodel import Field, SQLModel

class Portfolio(SQLModel, table=True):
    __tablename__ = "PORTAR"

    PTCodi: str = Field(primary_key=True)
    PTDesc: str
    PTEst: Optional[str] = None
    PTRApr: Optional[str] = None
    PTTipApr: Optional[str] = None
    PTCarApr: Optional[int] = None
    PtTer: Optional[str] = None
    PtAprP: Optional[str] = None
    PtTipAprP: Optional[str] = None
    PtCarAprP: Optional[int] = None
    PTPgp: Optional[str] = None