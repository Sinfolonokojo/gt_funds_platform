# app/api/clients.py

from fastapi import APIRouter, HTTPException, status
from typing import List
from .. import database as db
from ..models.client import ClientCreate, ClientInDB
from bson import ObjectId  # <-- Importante añadir esta línea

router = APIRouter()

# --- INICIO DE LA LÓGICA DE CONVERSIÓN MANUAL ---

def convert_document(document: dict):
    """
    Convierte el _id de ObjectId a string en un diccionario.
    """
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

# --- FIN DE LA LÓGICA DE CONVERSIÓN MANUAL ---


@router.post("/", response_model=ClientInDB, status_code=status.HTTP_201_CREATED)
async def create_client(client: ClientCreate):
    client_dict = client.model_dump()
    result = await db.db["clients"].insert_one(client_dict)
    created_document = await db.db["clients"].find_one({"_id": result.inserted_id})

    if created_document:
        # Primero convertimos el _id a string...
        converted_doc = convert_document(created_document)
        # ...y LUEGO validamos con el modelo.
        return ClientInDB.model_validate(converted_doc)

    raise HTTPException(status_code=500, detail="Error al crear el cliente.")


@router.get("/", response_model=List[ClientInDB])
async def list_clients():
    clients_list = []
    clients_cursor = db.db["clients"].find()

    async for document in clients_cursor:
        # Primero convertimos el _id a string...
        converted_doc = convert_document(document)
        # ...y LUEGO validamos y añadimos a la lista.
        clients_list.append(ClientInDB.model_validate(converted_doc))

    return clients_list