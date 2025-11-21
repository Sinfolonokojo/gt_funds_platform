# backend/app/api/payouts.py

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from pydantic import ValidationError

from .. import database as db
from ..models.payout import PayoutCreate, PayoutInDB

nested_router = APIRouter()
direct_router = APIRouter()

def convert_document(document: dict):
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

# --- Operaciones en el Router ANIDADO ---

@nested_router.post("/", response_model=PayoutInDB, status_code=status.HTTP_201_CREATED)
async def create_payout(kyc_id: str, payout: PayoutCreate):
    """Crea un nuevo payout asociado a un KYC."""
    if not await db.db["kycs"].find_one({"_id": ObjectId(kyc_id)}):
        raise HTTPException(status_code=404, detail=f"No se encontró el KYC con ID {kyc_id}")
        
    payout_dict = payout.model_dump()
    payout_dict["kycId"] = kyc_id
    
    result = await db.db["payouts"].insert_one(payout_dict)
    created_document = await db.db["payouts"].find_one({"_id": result.inserted_id})
    
    if created_document:
        converted_doc = convert_document(created_document)
        return PayoutInDB.model_validate(converted_doc)
        
    raise HTTPException(status_code=500, detail="Error al crear el payout.")

@nested_router.get("/", response_model=List[PayoutInDB])
@nested_router.get("/", response_model=List[PayoutInDB])
async def list_payouts_for_kyc(kyc_id: str):
    payouts_list = []
    payouts_cursor = db.db["payouts"].find({"kycId": kyc_id})
    
    async for document in payouts_cursor:
        try:
            converted_doc = convert_document(document)
            payouts_list.append(PayoutInDB.model_validate(converted_doc))
        except ValidationError as e:
            print(f"Documento de payout inválido omitido para kyc_id {kyc_id}: {e}")
            continue
            
    return payouts_list

# --- Operaciones en el Router DIRECTO ---

@direct_router.get("/{payout_id}", response_model=PayoutInDB)
async def get_payout(payout_id: str):
    """Obtiene un payout específico por su ID."""
    if not ObjectId.is_valid(payout_id):
        raise HTTPException(status_code=400, detail=f"ID de payout no válido: {payout_id}")
    document = await db.db["payouts"].find_one({"_id": ObjectId(payout_id)})
    if document:
        converted_doc = convert_document(document)
        return PayoutInDB.model_validate(converted_doc)
    raise HTTPException(status_code=404, detail=f"Payout no encontrado: {payout_id}")

@direct_router.put("/{payout_id}", response_model=PayoutInDB)
async def update_payout(payout_id: str, payout_update: PayoutCreate):
    """Actualiza un payout por su ID."""
    if not ObjectId.is_valid(payout_id):
        raise HTTPException(status_code=400, detail=f"ID de payout no válido: {payout_id}")
    update_data = payout_update.model_dump(exclude_unset=True)
    result = await db.db["payouts"].update_one({"_id": ObjectId(payout_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Payout no encontrado: {payout_id}")
    updated_doc = await db.db["payouts"].find_one({"_id": ObjectId(payout_id)})
    return PayoutInDB.model_validate(convert_document(updated_doc))

@direct_router.delete("/{payout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payout(payout_id: str):
    """Elimina un payout por su ID."""
    if not ObjectId.is_valid(payout_id):
        raise HTTPException(status_code=400, detail=f"ID de payout no válido: {payout_id}")
    result = await db.db["payouts"].delete_one({"_id": ObjectId(payout_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Payout no encontrado: {payout_id}")
    return