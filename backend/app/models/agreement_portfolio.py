from sqlmodel import Field, SQLModel

class AgreementPortfolio(SQLModel, table=True):
    __tablename__ = "MAEEMP31"

    MENNIT: str = Field(primary_key=True)
    PTCodi: str = Field(primary_key=True)