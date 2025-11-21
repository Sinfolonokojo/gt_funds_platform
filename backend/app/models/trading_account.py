# backend/app/models/trading_account.py

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class TradingAccountBase(BaseModel):
    """Campos comunes de una cuenta de trading."""
    accountNumber: str = Field(min_length=1, max_length=50, description="Número de cuenta")
    cost: float = Field(default=0.0, ge=0, le=1000000, description="Costo en USD")
    accountSize: float = Field(ge=0, le=10000000, description="Tamaño de cuenta en USD")
    propFirm: str = Field(min_length=1, max_length=100, description="Nombre de la prop firm")
    status: str = Field(default="Pending", pattern=r'^(Pending|Active|Burned)$', description="Estado de la cuenta")
    phase: str = Field(default="fase1", pattern=r'^(fase1|fase2|real|quemada)$', description="Fase de la cuenta")
    cycleId: Optional[str] = Field(None, pattern=r'^[0-9a-fA-F]{24}$', description="ID del ciclo")
    login: Optional[str] = Field(None, max_length=50, description="Login MT5")
    password: Optional[str] = Field(None, max_length=100, description="Password MT5")
    server: Optional[str] = Field(None, max_length=100, description="Servidor MT5")

class TradingAccountCreate(TradingAccountBase):
    """Modelo para recibir datos al crear una cuenta."""
    pass

class TradingAccountInDB(TradingAccountBase):
    id: str = Field(alias="_id")
    kycId: str

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        # CRÍTICO: Esto asegura que 'id' se incluya en la respuesta JSON
        by_alias=False
    )

class TradingAccountUpdate(BaseModel):
    """Modelo para actualizar una cuenta. Todos los campos son opcionales."""
    accountNumber: Optional[str] = None
    cost: Optional[float] = None
    accountSize: Optional[float] = None
    propFirm: Optional[str] = None
    status: Optional[str] = None
    phase: Optional[str] = None
    cycleId: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None
    server: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True
    )