# backend/app/models/payout.py

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class PayoutBase(BaseModel):
    """Campos comunes de un payout."""
    amount: float
    payoutDate: datetime = Field(default_factory=datetime.utcnow)
    # Puedes añadir otros campos que mencionaste aquí si pertenecen al payout individual
    # Por ejemplo: propFirm, a qué cuenta se asocia el retiro, etc.
    # Por ahora lo mantenemos simple con solo el monto y la fecha.

class PayoutCreate(PayoutBase):
    """Modelo para recibir datos al crear un payout."""
    pass

class PayoutInDB(PayoutBase):
    """Modelo que representa el payout en la base de datos."""
    id: str = Field(alias="_id")
    kycId: str # Vínculo al KYC

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )