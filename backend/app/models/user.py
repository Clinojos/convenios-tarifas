# models/user.py
from sqlmodel import SQLModel, Field, Column, String

class User(SQLModel, table=True):
    __tablename__ = "ADMUSR"
    __table_args__ = {"schema": "dbo"}

    id: str = Field(sa_column=Column("AUsrId", String, primary_key=True))
    description: str = Field(sa_column=Column("AUsrDsc", String))
    password: str = Field(sa_column=Column("AUsrPsw", String))
    group_id: str = Field(sa_column=Column("AGrpId", String))
    status: str = Field(sa_column=Column("AUsrEst", String))