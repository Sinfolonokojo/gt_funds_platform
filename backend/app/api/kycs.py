# backend/app/api/kycs.py

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from .. import database as db
from ..models.kyc import KycCreate, KycInDB

router = APIRouter()

def convert_document(document: dict):
    """Convierte el _id de ObjectId a string."""
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

# --- Endpoint de CREACIÓN (ya lo teníamos) ---
@router.post("/", response_model=KycInDB, status_code=status.HTTP_201_CREATED)
async def create_kyc_record(kyc: KycCreate):
    kyc_dict = kyc.model_dump()
    try:
        result = await db.db["kycs"].insert_one(kyc_dict)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un registro KYC con el email '{kyc.email}'"
        )
    created_document = await db.db["kycs"].find_one({"_id": result.inserted_id})
    if created_document:
        converted_doc = convert_document(created_document)
        return KycInDB.model_validate(converted_doc)
    raise HTTPException(status_code=500, detail="Error al crear el registro KYC.")

# --- Endpoint para LEER TODOS los registros (con paginación opcional) ---
@router.get("/", response_model=Dict[str, Any])
async def list_kyc_records(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a retornar"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email")
):
    # Build query filter
    query_filter = {}
    if search:
        query_filter["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]

    # Get total count
    total = await db.db["kycs"].count_documents(query_filter)

    # Get paginated results
    kycs_list = []
    kycs_cursor = db.db["kycs"].find(query_filter).skip(skip).limit(limit).sort("_id", -1)
    async for document in kycs_cursor:
        converted_doc = convert_document(document)
        kycs_list.append(KycInDB.model_validate(converted_doc))

    return {
        "data": kycs_list,
        "total": total,
        "skip": skip,
        "limit": limit,
        "hasMore": skip + len(kycs_list) < total
    }

# --- Endpoint para LEER UN registro por ID ---
@router.get("/{kyc_id}", response_model=KycInDB)
async def get_kyc_record(kyc_id: str):
    if not ObjectId.is_valid(kyc_id):
        raise HTTPException(status_code=400, detail=f"El ID '{kyc_id}' no es válido.")

    document = await db.db["kycs"].find_one({"_id": ObjectId(kyc_id)})

    if document:
        converted_doc = convert_document(document)
        return KycInDB.model_validate(converted_doc)

    raise HTTPException(status_code=404, detail=f"No se encontró el registro KYC con ID {kyc_id}.")

# --- Endpoint para ACTUALIZAR un registro por ID ---
@router.put("/{kyc_id}", response_model=KycInDB)
async def update_kyc_record(kyc_id: str, kyc_update_data: KycCreate):
    if not ObjectId.is_valid(kyc_id):
        raise HTTPException(status_code=400, detail=f"El ID '{kyc_id}' no es válido.")

    update_data_dict = kyc_update_data.model_dump(exclude_unset=True)

    if not update_data_dict:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")

    result = await db.db["kycs"].update_one(
        {"_id": ObjectId(kyc_id)},
        {"$set": update_data_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"No se encontró el registro KYC con ID {kyc_id}.")

    updated_document = await db.db["kycs"].find_one({"_id": ObjectId(kyc_id)})
    converted_doc = convert_document(updated_document)
    return KycInDB.model_validate(converted_doc)

# --- Endpoint para ELIMINAR un registro por ID ---
@router.delete("/{kyc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_kyc_record(kyc_id: str):
    if not ObjectId.is_valid(kyc_id):
        raise HTTPException(status_code=400, detail=f"El ID '{kyc_id}' no es válido.")

    result = await db.db["kycs"].delete_one({"_id": ObjectId(kyc_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No se encontró el registro KYC con ID {kyc_id} para eliminar.")

    return # Devolvemos una respuesta vacía, como indica el código 204
