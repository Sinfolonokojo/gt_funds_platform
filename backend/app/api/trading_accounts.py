# backend/app/api/trading_accounts.py

from fastapi import APIRouter, HTTPException, status
from typing import List
from bson import ObjectId
from pydantic import ValidationError
from .. import database as db
# Importamos solo los modelos que necesitamos
from ..models.trading_account import TradingAccountCreate, TradingAccountInDB

nested_router = APIRouter()
direct_router = APIRouter()

def convert_document(document: dict):
    if "_id" in document and isinstance(document["_id"], ObjectId):
        document["_id"] = str(document["_id"])
    return document

# --- Operaciones en el Router ANIDADO ---

@nested_router.post("/", response_model=TradingAccountInDB, status_code=status.HTTP_201_CREATED)
async def create_trading_account(kyc_id: str, account: TradingAccountCreate):
    """Crea una nueva cuenta de trading asociada a un KYC."""
    if not ObjectId.is_valid(kyc_id) or not await db.db["kycs"].find_one({"_id": ObjectId(kyc_id)}):
        raise HTTPException(status_code=404, detail=f"No se encontró el KYC con ID {kyc_id}")

    if account.cycleId and (not ObjectId.is_valid(account.cycleId) or not await db.db["cycles"].find_one({"_id": ObjectId(account.cycleId)})):
        raise HTTPException(status_code=404, detail=f"No se encontró el Ciclo con ID {account.cycleId}")

    account_dict = account.model_dump()
    account_dict["kycId"] = kyc_id

    result = await db.db["trading_accounts"].insert_one(account_dict)
    created_document = await db.db["trading_accounts"].find_one({"_id": result.inserted_id})
    
    if created_document:
        # Usamos model_validate con el documento convertido.
        # Con la model_config correcta, esto funciona.
        return TradingAccountInDB.model_validate(convert_document(created_document))
        
    raise HTTPException(status_code=500, detail="Error al crear la cuenta de trading.")

# (La función list_accounts_for_kyc es correcta, no necesita cambios)
@nested_router.get("/", response_model=List[TradingAccountInDB])
async def list_accounts_for_kyc(kyc_id: str):
    """Obtiene todas las cuentas de trading asociadas a un KYC."""
    accounts_list = []
    accounts_cursor = db.db["trading_accounts"].find({"kycId": kyc_id})
    
    async for document in accounts_cursor:
        try:
            # Usamos model_validate con el documento convertido.
            # Con la model_config correcta, esto funciona.
            accounts_list.append(TradingAccountInDB.model_validate(convert_document(document)))
        except ValidationError as e:
            print(f"Documento de cuenta inválido omitido: {e}")
            continue
            
    return accounts_list

# --- Operaciones en el Router DIRECTO ---

# (La función get_trading_account es correcta, no necesita cambios)
@direct_router.get("/{account_id}", response_model=TradingAccountInDB)
async def get_trading_account(account_id: str):
    """Obtiene una cuenta de trading específica por su ID."""
    if not ObjectId.is_valid(account_id):
        raise HTTPException(status_code=400, detail=f"El ID de cuenta '{account_id}' no es válido.")

    document = await db.db["trading_accounts"].find_one({"_id": ObjectId(account_id)})

    if document:
        try:
            converted_doc = convert_document(document)
            return TradingAccountInDB.model_validate(converted_doc)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al validar los datos de la cuenta: {e}")

    raise HTTPException(status_code=404, detail=f"No se encontró la cuenta con ID {account_id}.")

@direct_router.put("/{account_id}", response_model=TradingAccountInDB)
async def update_trading_account(account_id: str, account_update: TradingAccountCreate):
    """Actualiza una cuenta de trading por su ID."""
    if not ObjectId.is_valid(account_id):
        raise HTTPException(status_code=400, detail=f"El ID de cuenta '{account_id}' no es válido.")

    # Convertimos los datos de entrada a un diccionario, excluyendo valores no enviados
    update_data_dict = account_update.model_dump(exclude_unset=True)

    # Validación adicional para el cycleId, si se está intentando cambiar
    if 'cycleId' in update_data_dict and update_data_dict['cycleId'] is not None:
        if not ObjectId.is_valid(update_data_dict['cycleId']) or not await db.db["cycles"].find_one({"_id": ObjectId(update_data_dict['cycleId'])}):
            raise HTTPException(status_code=404, detail=f"El Cycle ID '{update_data_dict['cycleId']}' no es válido o no encontrado.")

    # IMPORTANTE: Nos aseguramos de que kycId NO se pueda actualizar
    if 'kycId' in update_data_dict:
        del update_data_dict['kycId']
            
    if not update_data_dict:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")

    result = await db.db["trading_accounts"].update_one(
        {"_id": ObjectId(account_id)},
        {"$set": update_data_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"No se encontró la cuenta con ID {account_id}.")
        
    updated_document = await db.db["trading_accounts"].find_one({"_id": ObjectId(account_id)})
    return TradingAccountInDB.model_validate(convert_document(updated_document))



@direct_router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trading_account(account_id: str):
    """Elimina una cuenta de trading por su ID."""
    if not ObjectId.is_valid(account_id):
        raise HTTPException(status_code=400, detail=f"El ID de cuenta '{account_id}' no es válido.")
        
    result = await db.db["trading_accounts"].delete_one({"_id": ObjectId(account_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"No se encontró la cuenta con ID {account_id}.")
        
    return