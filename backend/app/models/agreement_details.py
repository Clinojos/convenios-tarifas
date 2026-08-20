# app/models/agreement_details.py
from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.roles_permissions import local_metadata

class AgreementDetails(SQLModel, table=True):
    __tablename__ = "agreement_details"
    metadata = local_metadata

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_key: str = Field(unique=True, index=True)  # = MENNIT
    contracted_services: Optional[str] = None
    invoice_filing: Optional[str] = None
    copayment_collection: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    start_date: Optional[str] = None
    last_rate_increase: Optional[str] = None
    expiration_date: Optional[str] = None
    auto_renewal: Optional[str] = None
    authorization_instructions: Optional[str] = None
    radication_documents: Optional[str] = None
    hidden_sections: Optional[str] = None