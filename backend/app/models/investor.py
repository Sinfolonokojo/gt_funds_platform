# backend/app/models/investor.py

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

class InvestmentSubModel(BaseModel):
    """Representa una inversión específica de un inversor en un ciclo."""
    cycleId: str  # ID del ciclo donde invirtió
    amount: float  # Monto invertido en este ciclo
    profitPercentage: float = 0.0  # Porcentaje de ganancia acordado
    investmentDate: datetime = Field(default_factory=datetime.utcnow)
    status: str = "Active"  # Active, Completed, Cancelled

class InvestorBase(BaseModel):
    """Campos comunes de un inversor."""
    name: str
    email: EmailStr
    phone: Optional[str] = None
    identification: Optional[str] = None  # DNI, pasaporte, etc.
    country: Optional[str] = None
    notes: Optional[str] = None

class InvestorCreate(InvestorBase):
    """Modelo para crear un nuevo inversor."""
    pass

class InvestorInDB(InvestorBase):
    """Modelo que representa un inversor en la base de datos."""
    id: str = Field(alias="_id")
    registrationDate: datetime = Field(default_factory=datetime.utcnow)
    totalInvested: float = 0.0  # Total histórico invertido
    investments: List[InvestmentSubModel] = []  # Lista de inversiones por ciclo
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        by_alias=False
    )

class InvestorUpdate(BaseModel):
    """Modelo para actualizar un inversor."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    identification: Optional[str] = None
    country: Optional[str] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(
        populate_by_name=True
    )

class InvestmentCreate(BaseModel):
    """Modelo para agregar una inversión a un inversor."""
    cycleId: str
    amount: float
    profitPercentage: float = 0.0
    
class InvestmentUpdate(BaseModel):
    """Modelo para actualizar una inversión."""
    amount: Optional[float] = None
    profitPercentage: Optional[float] = None
    status: Optional[str] = None