# app/models/agreement_contacts.py
from typing import Optional
from sqlmodel import Field, SQLModel
from app.models.roles_permissions import local_metadata

class AgreementContact(SQLModel, table=True):
    __tablename__ = "agreement_contacts"
    metadata = local_metadata

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_key: str = Field(index=True)  # = MENNIT
    full_name: str
    role: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    sort_order: int = 1