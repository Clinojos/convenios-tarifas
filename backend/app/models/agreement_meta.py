from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from app.models.roles_permissions import local_metadata

class AgreementMeta(SQLModel, table=True):
    __tablename__ = "agreement_meta"
    metadata = local_metadata

    id: Optional[int] = Field(default=None, primary_key=True)
    contract_key: str = Field(unique=True, index=True)   # = MENNIT en Hosvital
    company_nit: str = Field(index=True)                  # = MEcntr en Hosvital
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    address: Optional[str] = None
    phone: Optional[str] = None
    habilitation_code: Optional[str] = None

class Company(SQLModel, table=True):
    __tablename__ = "companies"
    metadata = local_metadata

    company_nit: str = Field(primary_key=True)
    logo_url: Optional[str] = None
    avatar_color: Optional[str] = None