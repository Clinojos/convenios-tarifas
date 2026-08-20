from sqlmodel import SQLModel, Field
from typing import Optional

class Contract(SQLModel, table=True):
    # Definimos explícitamente el nombre de la tabla en plural
    __tablename__ = "contracts"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    eps: str
    description: Optional[str] = None
    service_code: Optional[str] = None