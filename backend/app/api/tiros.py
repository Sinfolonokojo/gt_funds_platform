# backend/app/api/tiros.py

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime

from .. import database as db
from ..models.tiro import TiroCreate, TiroInDB, TiroUpdate

router = APIRouter()

def convert_document(document: dict):
    """Convierte el _id de ObjectId a string."""
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

def migrate_old_tiro_structure(tiro_doc: dict) -> dict:
    """
    Convierte estructura antigua de tiro a nueva estructura.
    Estructura antigua: leg1: {accountId, direction, volume}
    Estructura nueva: leg1: {direction, accounts: [{accountId, operations: [{volume, entryPrice}]}]}
    """
    # Detectar si es estructura antigua (tiene accountId directamente en leg1)
    if "leg1" in tiro_doc and "accountId" in tiro_doc.get("leg1", {}):
        # Convertir leg1
        old_leg1 = tiro_doc["leg1"]
        tiro_doc["leg1"] = {
            "direction": old_leg1.get("direction", "BUY"),
            "accounts": [
                {
                    "accountId": old_leg1["accountId"],
                    "operations": [
                        {
                            "volume": old_leg1.get("volume", 1.0),
                            "entryPrice": 0.0,
                            "exitPrice": None,
                            "ticketId": old_leg1.get("ticketId"),
                            "result": None
                        }
                    ]
                }
            ]
        }

    # Convertir leg2
    if "leg2" in tiro_doc and "accountId" in tiro_doc.get("leg2", {}):
        old_leg2 = tiro_doc["leg2"]
        tiro_doc["leg2"] = {
            "direction": old_leg2.get("direction", "SELL"),
            "accounts": [
                {
                    "accountId": old_leg2["accountId"],
                    "operations": [
                        {
                            "volume": old_leg2.get("volume", 1.0),
                            "entryPrice": 0.0,
                            "exitPrice": None,
                            "ticketId": old_leg2.get("ticketId"),
                            "result": None
                        }
                    ]
                }
            ]
        }

    return tiro_doc

@router.post("/", response_model=TiroInDB, status_code=status.HTTP_201_CREATED)
async def create_tiro(tiro: TiroCreate):
    """
    Crea un nuevo Tiro.

    Validaciones:
    - El cycleId debe existir
    - Todas las cuentas en leg1 y leg2 deben existir
    - leg1 y leg2 deben tener direcciones opuestas (BUY/SELL)
    - Cada pata debe tener exactamente 2 cuentas
    - Cada cuenta debe tener al menos 1 operación
    """
    # Validar que el cycle existe
    if not ObjectId.is_valid(tiro.cycleId):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {tiro.cycleId}")

    cycle = await db.db["cycles"].find_one({"_id": ObjectId(tiro.cycleId)})
    if not cycle:
        raise HTTPException(status_code=404, detail=f"Ciclo no encontrado: {tiro.cycleId}")

    # Recopilar todos los accountIds únicos de ambas patas
    all_account_ids = set()

    for account_in_leg in tiro.leg1.accounts:
        all_account_ids.add(account_in_leg.accountId)

    for account_in_leg in tiro.leg2.accounts:
        all_account_ids.add(account_in_leg.accountId)

    # Validar que no haya accountIds duplicados dentro de la misma pata
    leg1_ids = [acc.accountId for acc in tiro.leg1.accounts]
    leg2_ids = [acc.accountId for acc in tiro.leg2.accounts]

    if len(leg1_ids) != len(set(leg1_ids)):
        raise HTTPException(status_code=400, detail="No se pueden usar cuentas duplicadas en leg1")

    if len(leg2_ids) != len(set(leg2_ids)):
        raise HTTPException(status_code=400, detail="No se pueden usar cuentas duplicadas en leg2")

    # Validar que todas las cuentas existen en la base de datos
    for account_id in all_account_ids:
        if not ObjectId.is_valid(account_id):
            raise HTTPException(status_code=400, detail=f"ID de cuenta no válido: {account_id}")

        account = await db.db["trading_accounts"].find_one({"_id": ObjectId(account_id)})
        if not account:
            raise HTTPException(status_code=404, detail=f"Cuenta no encontrada: {account_id}")

    # Nota: Las validaciones de direcciones opuestas, cantidad de cuentas,
    # y cantidad de operaciones ya se manejan en el modelo Pydantic (tiro.py)

    # Crear el tiro
    tiro_dict = tiro.model_dump()
    result = await db.db["tiros"].insert_one(tiro_dict)
    created_document = await db.db["tiros"].find_one({"_id": result.inserted_id})

    if created_document:
        return TiroInDB.model_validate(convert_document(created_document))

    raise HTTPException(status_code=500, detail="Error al crear el tiro.")

@router.get("/", response_model=List[TiroInDB])
async def list_all_tiros():
    """Obtiene todos los tiros."""
    tiros_list = []
    tiros_cursor = db.db["tiros"].find()
    async for document in tiros_cursor:
        document = convert_document(document)
        document = migrate_old_tiro_structure(document)
        tiros_list.append(TiroInDB.model_validate(document))
    return tiros_list

@router.get("/cycle/{cycle_id}", response_model=List[TiroInDB])
async def list_tiros_by_cycle(cycle_id: str):
    """Obtiene todos los tiros de un ciclo específico."""
    if not ObjectId.is_valid(cycle_id):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {cycle_id}")

    tiros_list = []
    tiros_cursor = db.db["tiros"].find({"cycleId": cycle_id})
    async for document in tiros_cursor:
        document = convert_document(document)
        document = migrate_old_tiro_structure(document)
        tiros_list.append(TiroInDB.model_validate(document))
    return tiros_list

@router.get("/{tiro_id}", response_model=TiroInDB)
async def get_tiro(tiro_id: str):
    """Obtiene un tiro específico por su ID."""
    if not ObjectId.is_valid(tiro_id):
        raise HTTPException(status_code=400, detail=f"ID de tiro no válido: {tiro_id}")

    document = await db.db["tiros"].find_one({"_id": ObjectId(tiro_id)})
    if document:
        document = convert_document(document)
        document = migrate_old_tiro_structure(document)
        return TiroInDB.model_validate(document)

    raise HTTPException(status_code=404, detail=f"Tiro no encontrado: {tiro_id}")

@router.put("/{tiro_id}", response_model=TiroInDB)
async def update_tiro(tiro_id: str, tiro_update: TiroUpdate):
    """
    Actualiza un tiro por su ID.
    
    Útil para:
    - Cerrar un tiro (cambiar status a "Cerrado" y añadir result y closeDate)
    - Actualizar notas
    - Corregir información de las patas
    """
    if not ObjectId.is_valid(tiro_id):
        raise HTTPException(status_code=400, detail=f"ID de tiro no válido: {tiro_id}")
    
    update_data = tiro_update.model_dump(exclude_unset=True)
    
    # Si se está cerrando el tiro, añadir closeDate automáticamente si no se proporcionó
    if update_data.get("status") == "Cerrado" and "closeDate" not in update_data:
        update_data["closeDate"] = datetime.utcnow()
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")
    
    result = await db.db["tiros"].update_one(
        {"_id": ObjectId(tiro_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Tiro no encontrado: {tiro_id}")

    updated_doc = await db.db["tiros"].find_one({"_id": ObjectId(tiro_id)})
    updated_doc = convert_document(updated_doc)
    updated_doc = migrate_old_tiro_structure(updated_doc)
    return TiroInDB.model_validate(updated_doc)

@router.delete("/{tiro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tiro(tiro_id: str):
    """Elimina un tiro por su ID."""
    if not ObjectId.is_valid(tiro_id):
        raise HTTPException(status_code=400, detail=f"ID de tiro no válido: {tiro_id}")
    
    result = await db.db["tiros"].delete_one({"_id": ObjectId(tiro_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Tiro no encontrado: {tiro_id}")
    
    return