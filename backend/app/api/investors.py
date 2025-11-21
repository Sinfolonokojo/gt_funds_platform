# backend/app/api/investors.py

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from pymongo.errors import DuplicateKeyError

from .. import database as db
from ..models.investor import (
    InvestorCreate,
    InvestorInDB,
    InvestorUpdate,
    InvestmentCreate,
    InvestmentUpdate
)

router = APIRouter()

def convert_document(document: dict):
    """Convierte el _id de ObjectId a string."""
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

@router.post("/", response_model=InvestorInDB, status_code=status.HTTP_201_CREATED)
async def create_investor(investor: InvestorCreate):
    """Crea un nuevo inversor."""
    investor_dict = investor.model_dump()
    investor_dict["investments"] = []
    investor_dict["totalInvested"] = 0.0

    try:
        result = await db.db["investors"].insert_one(investor_dict)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un inversor con el email '{investor.email}'"
        )
    created_document = await db.db["investors"].find_one({"_id": result.inserted_id})

    if created_document:
        return InvestorInDB.model_validate(convert_document(created_document))

    raise HTTPException(status_code=500, detail="Error al crear el inversor.")

@router.get("/", response_model=List[InvestorInDB])
async def list_investors():
    """Obtiene todos los inversores."""
    investors_list = []
    investors_cursor = db.db["investors"].find()

    async for document in investors_cursor:
        investors_list.append(InvestorInDB.model_validate(convert_document(document)))

    return investors_list

@router.get("/{investor_id}", response_model=InvestorInDB)
async def get_investor(investor_id: str):
    """Obtiene un inversor específico por su ID."""
    if not ObjectId.is_valid(investor_id):
        raise HTTPException(status_code=400, detail=f"ID de inversor no válido: {investor_id}")

    document = await db.db["investors"].find_one({"_id": ObjectId(investor_id)})
    if document:
        return InvestorInDB.model_validate(convert_document(document))

    raise HTTPException(status_code=404, detail=f"Inversor no encontrado: {investor_id}")

@router.put("/{investor_id}", response_model=InvestorInDB)
async def update_investor(investor_id: str, investor_update: InvestorUpdate):
    """Actualiza un inversor por su ID."""
    if not ObjectId.is_valid(investor_id):
        raise HTTPException(status_code=400, detail=f"ID de inversor no válido: {investor_id}")

    update_data = investor_update.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")

    result = await db.db["investors"].update_one(
        {"_id": ObjectId(investor_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Inversor no encontrado: {investor_id}")

    updated_doc = await db.db["investors"].find_one({"_id": ObjectId(investor_id)})
    return InvestorInDB.model_validate(convert_document(updated_doc))

@router.delete("/{investor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investor(investor_id: str):
    """Elimina un inversor por su ID."""
    if not ObjectId.is_valid(investor_id):
        raise HTTPException(status_code=400, detail=f"ID de inversor no válido: {investor_id}")

    result = await db.db["investors"].delete_one({"_id": ObjectId(investor_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Inversor no encontrado: {investor_id}")

    return

# ============================================
# Endpoints para gestionar inversiones
# ============================================

@router.post("/{investor_id}/investments", response_model=InvestorInDB)
async def add_investment(investor_id: str, investment: InvestmentCreate):
    """Agrega una inversión a un inversor."""
    if not ObjectId.is_valid(investor_id):
        raise HTTPException(status_code=400, detail=f"ID de inversor no válido: {investor_id}")

    # Validar que el inversor existe
    investor = await db.db["investors"].find_one({"_id": ObjectId(investor_id)})
    if not investor:
        raise HTTPException(status_code=404, detail=f"Inversor no encontrado: {investor_id}")

    # Validar que el ciclo existe
    if not ObjectId.is_valid(investment.cycleId):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {investment.cycleId}")

    cycle = await db.db["cycles"].find_one({"_id": ObjectId(investment.cycleId)})
    if not cycle:
        raise HTTPException(status_code=404, detail=f"Ciclo no encontrado: {investment.cycleId}")

    # Crear la inversión
    investment_dict = investment.model_dump()
    investment_dict["investmentDate"] = datetime.utcnow()
    investment_dict["status"] = "Active"

    # Actualizar el inversor
    new_total = investor.get("totalInvested", 0.0) + investment.amount

    result = await db.db["investors"].update_one(
        {"_id": ObjectId(investor_id)},
        {
            "$push": {"investments": investment_dict},
            "$set": {"totalInvested": new_total}
        }
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Error al agregar la inversión.")

    updated_doc = await db.db["investors"].find_one({"_id": ObjectId(investor_id)})
    return InvestorInDB.model_validate(convert_document(updated_doc))

@router.get("/{investor_id}/investments")
async def get_investor_investments(investor_id: str):
    """Obtiene todas las inversiones de un inversor."""
    if not ObjectId.is_valid(investor_id):
        raise HTTPException(status_code=400, detail=f"ID de inversor no válido: {investor_id}")

    investor = await db.db["investors"].find_one({"_id": ObjectId(investor_id)})
    if not investor:
        raise HTTPException(status_code=404, detail=f"Inversor no encontrado: {investor_id}")

    investments = investor.get("investments", [])

    # Enriquecer con información de los ciclos
    enriched_investments = []
    for inv in investments:
        cycle = await db.db["cycles"].find_one({"_id": ObjectId(inv["cycleId"])})
        inv_copy = inv.copy()
        inv_copy["cycleName"] = cycle.get("name") if cycle else "Ciclo no encontrado"
        enriched_investments.append(inv_copy)

    return enriched_investments
