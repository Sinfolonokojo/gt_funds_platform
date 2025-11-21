# backend/app/models/cycle.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class CycleBase(BaseModel):
    name: str
    status: str = "Activo"

class CycleCreate(CycleBase):
    startDate: datetime = Field(default_factory=datetime.utcnow)

class CycleInDB(CycleBase):
    id: str = Field(alias="_id")
    startDate: datetime

    model_config = ConfigDict(populate_by_name=True)