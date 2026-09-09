from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profile"

    user_id: str = Field(primary_key=True)
    display_name: Optional[str] = Field(default=None)
    photo_url: Optional[str] = Field(default=None)
    updated_at: datetime = Field(default_factory=datetime.utcnow)