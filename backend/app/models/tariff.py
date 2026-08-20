from typing import Optional
from sqlmodel import Field, SQLModel

class Tariff(SQLModel, table=True):
    __tablename__ = "TARIFAS"

    TrfCod: str = Field(primary_key=True)
    TrfDsc: Optional[str] = None


class ProcedurePrice(SQLModel, table=True):
    __tablename__ = "HOMPROC"

    PRCODI: str = Field(primary_key=True)
    TrfCod: str = Field(primary_key=True)
    HomProCod: Optional[str] = None
    HomProDsc: Optional[str] = None
    HomProCnt: Optional[float] = None
    HomProVlr: Optional[float] = None
    HomProLH: Optional[str] = None
    HOMPROOBS: Optional[str] = None
    HOMPROPR: Optional[str] = None