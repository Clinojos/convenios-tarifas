from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class AgreementVisit(SQLModel, table=True):
    __tablename__ = "agreement_visits"

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_key: str = Field(index=True)
    company_nit: Optional[str] = Field(default=None, index=True)
    visited_at: datetime = Field(default_factory=datetime.utcnow)