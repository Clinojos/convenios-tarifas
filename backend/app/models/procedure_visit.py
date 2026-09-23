from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class ProcedureVisit(SQLModel, table=True):
    __tablename__ = "procedure_visits"

    id: Optional[int] = Field(default=None, primary_key=True)
    procedure_code: str = Field(index=True)
    procedure_name: Optional[str] = Field(default=None)
    visited_at: datetime = Field(default_factory=datetime.utcnow)