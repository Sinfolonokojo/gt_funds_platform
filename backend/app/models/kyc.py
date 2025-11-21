# backend/app/models/kyc.py

from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Sub-modelos para datos anidados ---
class DocumentSubModel(BaseModel):
    """Un sub-modelo para representar un documento adjunto."""
    fileName: str
    uploadDate: datetime = Field(default_factory=datetime.utcnow)

# --- Modelos Principales de KYC ---
class KycBase(BaseModel):
    """Campos comunes que siempre tendrá un KYC."""
    name: str = Field(min_length=2, max_length=100, description="Nombre completo")
    phone: str = Field(min_length=5, max_length=20, pattern=r'^[\d\s\-\+\(\)]+$', description="Teléfono")
    email: EmailStr = Field(description="Email válido")
    creditCard: Optional[str] = Field(None, max_length=50, description="Tarjeta de crédito")
    address: Optional[str] = Field(None, max_length=500, description="Dirección")
    status: bool = Field(default=True, description="Estado activo/inactivo")
    dashboardEnabled: bool = Field(default=False, description="Dashboard habilitado")
    cycleId: Optional[str] = Field(None, pattern=r'^[0-9a-fA-F]{24}$', description="ID del ciclo")

class KycCreate(KycBase):
    """Modelo para recibir datos al crear un nuevo KYC vía API."""
    pass # Hereda todos los campos de KycBase

class KycInDB(KycBase):
    """Modelo que representa un KYC tal como está en la base de datos."""
    id: str = Field(alias="_id")
    submittedDate: datetime = Field(default_factory=datetime.utcnow)
    documents: List[DocumentSubModel] = [] # Lista de documentos

    model_config = ConfigDict(
        populate_by_name=True, # Permite usar el alias "_id"
        arbitrary_types_allowed=True # Necesario para tipos complejos
    )