# app/models/agreement_documents.py
from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.roles_permissions import local_metadata

class AgreementDocument(SQLModel, table=True):
    __tablename__ = "agreement_documents"
    metadata = local_metadata

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_key: str = Field(index=True)  # = MENNIT
    sort_order: int
    description: str