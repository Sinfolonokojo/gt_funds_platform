# backend/app/models/tiro.py

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime

# Sub-modelo para una operación individual
class OperationSubModel(BaseModel):
    """Representa una operación individual dentro de una cuenta."""
    volume: float  # Lotaje (ej: 1.0, 0.5)
    entryPrice: float  # Precio de entrada
    exitPrice: Optional[float] = None  # Precio de salida (cuando se cierra)
    ticketId: Optional[str] = None  # ID de la operación en MT5
    result: Optional[float] = None  # Resultado individual de esta operación en USD

# Sub-modelo para una cuenta dentro de una pata
class AccountInLeg(BaseModel):
    """Representa una cuenta con sus operaciones dentro de una pata."""
    accountId: str  # ID de la cuenta de trading
    operations: List[OperationSubModel]  # Lista de operaciones (mínimo 1)

    @field_validator('operations')
    def validate_operations(cls, v):
        if not v or len(v) < 1:
            raise ValueError('Cada cuenta debe tener al menos 1 operación')
        return v

# Sub-modelo para una "pata" (leg) del tiro
class LegSubModel(BaseModel):
    """Representa una de las dos patas del tiro."""
    direction: str  # "BUY" o "SELL" - aplica a todas las operaciones de esta pata
    accounts: List[AccountInLeg]  # Lista de cuentas (debe tener entre 1 y 2)

    @field_validator('accounts')
    def validate_accounts(cls, v):
        if len(v) < 1 or len(v) > 2:
            raise ValueError('Cada pata debe tener entre 1 y 2 cuentas')
        return v

    @field_validator('direction')
    def validate_direction(cls, v):
        if v not in ["BUY", "SELL"]:
            raise ValueError('La dirección debe ser "BUY" o "SELL"')
        return v

class TiroBase(BaseModel):
    """Campos comunes de un Tiro."""
    cycleId: str  # ID del ciclo al que pertenece
    symbol: str  # Par de divisas (ej: "EURUSD")
    status: str = "Abierto"  # "Abierto" o "Cerrado"
    leg1: LegSubModel  # Primera pata
    leg2: LegSubModel  # Segunda pata
    result: Optional[float] = None  # Resultado total en USD (suma de todos los results)
    notes: Optional[str] = None  # Notas adicionales

    @field_validator('leg2')
    def validate_opposite_directions(cls, v, info):
        if 'leg1' in info.data:
            leg1 = info.data['leg1']
            if leg1.direction == v.direction:
                raise ValueError('Las patas deben tener direcciones opuestas (una BUY y una SELL)')
        return v

class TiroCreate(TiroBase):
    """Modelo para crear un nuevo Tiro."""
    openDate: datetime = Field(default_factory=datetime.utcnow)

class TiroInDB(TiroBase):
    """Modelo que representa un Tiro en la base de datos."""
    id: str = Field(alias="_id")
    openDate: datetime
    closeDate: Optional[datetime] = None  # Se llena cuando se cierra el tiro

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class TiroUpdate(BaseModel):
    """Modelo para actualizar un Tiro (todos los campos opcionales)."""
    status: Optional[str] = None
    result: Optional[float] = None
    closeDate: Optional[datetime] = None
    notes: Optional[str] = None
    leg1: Optional[LegSubModel] = None
    leg2: Optional[LegSubModel] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )