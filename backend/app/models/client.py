# app/models/client.py

from pydantic import BaseModel, Field, EmailStr, ConfigDict

# Propiedades compartidas (sin cambios)
class ClientBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    status: str = "Active"
    totalInvested: float = 0.0

# Modelo para creación (sin cambios)
class ClientCreate(ClientBase):
    pass

# --- INICIO DE LA SECCIÓN MODIFICADA ---

# Modelo que representa al cliente en la base de datos
class ClientInDB(ClientBase):
    # Declaramos que el campo 'id' será una STRING.
    id: str = Field(alias="_id")

    # La configuración ahora es más simple
    model_config = ConfigDict(
        populate_by_name=True,
    )

# --- FIN DE LA SECCIÓN MODIFICADA ---