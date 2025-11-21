# backend/app/api/cycles.py

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from bson import ObjectId

from .. import database as db
from ..models.cycle import CycleCreate, CycleInDB
from ..models.trading_account import TradingAccountInDB
from ..models.tiro import TiroInDB

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
                            "entryPrice": 0.0,  # No teníamos este dato antes
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

@router.post("/", response_model=CycleInDB, status_code=status.HTTP_201_CREATED)
async def create_cycle(cycle: CycleCreate):
    """Crea un nuevo ciclo."""
    cycle_dict = cycle.model_dump()
    result = await db.db["cycles"].insert_one(cycle_dict)
    created_document = await db.db["cycles"].find_one({"_id": result.inserted_id})
    if created_document:
        return CycleInDB.model_validate(convert_document(created_document))
    raise HTTPException(status_code=500, detail="Error al crear el ciclo.")

@router.get("/", response_model=List[CycleInDB])
async def list_cycles():
    """Obtiene una lista de todos los ciclos."""
    cycles_list = []
    cycles_cursor = db.db["cycles"].find()
    async for document in cycles_cursor:
        cycles_list.append(CycleInDB.model_validate(convert_document(document)))
    return cycles_list

@router.get("/statistics/historical", response_model=Dict[str, Any])
async def get_historical_statistics():
    """
    Obtiene estadísticas históricas de todos los ciclos completados.
    Retorna promedios de tasa de conversión, costos, y profits.
    """
    # Obtener todos los ciclos completados
    completed_cycles_cursor = db.db["cycles"].find({"status": "Completado"})

    total_conversion_rate = 0.0
    total_cost = 0.0
    total_accounts = 0
    cycles_with_data = 0

    async for cycle_doc in completed_cycles_cursor:
        cycle_id = str(cycle_doc["_id"])

        # Obtener todas las cuentas del ciclo
        accounts_cursor = db.db["trading_accounts"].find({"cycleId": cycle_id})

        cycle_accounts = []
        async for acc_doc in accounts_cursor:
            cycle_accounts.append(acc_doc)

        if len(cycle_accounts) > 0:
            # Calcular tasa de conversión del ciclo
            accounts_in_real = len([acc for acc in cycle_accounts if acc.get("phase") == "real"])
            conversion_rate = (accounts_in_real / len(cycle_accounts)) * 100
            total_conversion_rate += conversion_rate

            # Calcular costos
            cycle_cost = sum([acc.get("cost", 0) for acc in cycle_accounts])
            total_cost += cycle_cost
            total_accounts += len(cycle_accounts)

            cycles_with_data += 1

    # Calcular promedios
    if cycles_with_data > 0:
        avg_conversion_rate = total_conversion_rate / cycles_with_data
        avg_cost_per_account = total_cost / total_accounts if total_accounts > 0 else 0
    else:
        avg_conversion_rate = 10.0  # Default
        avg_cost_per_account = 150.0  # Default

    return {
        "promedioTasaConversion": round(avg_conversion_rate, 2),
        "promedioCostoPorCuenta": round(avg_cost_per_account, 2),
        "promedioProfitPorCuenta": 5000.0,  # Valor estimado - puede ajustarse según datos reales
        "totalCiclosCompletados": cycles_with_data,
        "totalCuentasAnalizadas": total_accounts
    }

@router.get("/{cycle_id}", response_model=CycleInDB)
async def get_cycle(cycle_id: str):
    """Obtiene un ciclo específico por su ID."""
    if not ObjectId.is_valid(cycle_id):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {cycle_id}")
    document = await db.db["cycles"].find_one({"_id": ObjectId(cycle_id)})
    if document:
        return CycleInDB.model_validate(convert_document(document))
    raise HTTPException(status_code=404, detail=f"Ciclo no encontrado: {cycle_id}")

@router.put("/{cycle_id}", response_model=CycleInDB)
async def update_cycle(cycle_id: str, cycle_update: CycleCreate):
    """Actualiza un ciclo por su ID."""
    if not ObjectId.is_valid(cycle_id):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {cycle_id}")
    update_data = cycle_update.model_dump(exclude_unset=True)
    result = await db.db["cycles"].update_one({"_id": ObjectId(cycle_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Ciclo no encontrado: {cycle_id}")
    updated_doc = await db.db["cycles"].find_one({"_id": ObjectId(cycle_id)})
    return CycleInDB.model_validate(convert_document(updated_doc))

@router.delete("/{cycle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cycle(cycle_id: str):
    """Elimina un ciclo por su ID."""
    if not ObjectId.is_valid(cycle_id):
        raise HTTPException(status_code=400, detail=f"ID de ciclo no válido: {cycle_id}")
    result = await db.db["cycles"].delete_one({"_id": ObjectId(cycle_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Ciclo no encontrado: {cycle_id}")
    return

@router.get("/{cycle_id}/dashboard", response_model=Dict[str, Any])
async def get_cycle_dashboard(cycle_id: str):
    """
    Obtiene una vista de dashboard completa para un ciclo específico,
    incluyendo resúmenes, cuentas y tiros.
    """
    if not ObjectId.is_valid(cycle_id):
        raise HTTPException(status_code=400, detail="ID de ciclo no válido.")

    # 1. Obtener los metadatos del ciclo
    cycle_document = await db.db["cycles"].find_one({"_id": ObjectId(cycle_id)})
    if not cycle_document:
        raise HTTPException(status_code=404, detail="Ciclo no encontrado.")

    # 2. Obtener todas las cuentas asociadas a este ciclo
    accounts_list = []
    accounts_cursor = db.db["trading_accounts"].find({"cycleId": cycle_id})
    async for acc_doc in accounts_cursor:
        # Convertir el _id ANTES de poblar el KYC
        acc_doc = convert_document(acc_doc)
        
        # Poblamos la información del KYC para cada cuenta
        kyc_info = await db.db["kycs"].find_one({"_id": ObjectId(acc_doc["kycId"])})
        acc_doc["nombre_kyc"] = kyc_info.get("name", "N/A") if kyc_info else "N/A"
        
        # Validar con el modelo DESPUÉS de añadir el nombre del KYC
        validated_account = TradingAccountInDB.model_validate(acc_doc)
        accounts_list.append(validated_account)
    
    # 3. Obtener todos los tiros asociados a este ciclo
    tiros_list = []
    tiros_cursor = db.db["tiros"].find({"cycleId": cycle_id})
    async for tiro_doc in tiros_cursor:
        # IMPORTANTE: Convertir el _id ANTES de poblar información adicional
        tiro_doc = convert_document(tiro_doc)

        # Migrar estructura antigua a nueva si es necesario
        tiro_doc = migrate_old_tiro_structure(tiro_doc)

        # Añadir información adicional de las cuentas involucradas (primera cuenta de cada leg)
        if tiro_doc["leg1"]["accounts"] and tiro_doc["leg1"]["accounts"][0]["accountId"]:
            leg1_account_id = tiro_doc["leg1"]["accounts"][0]["accountId"]
            if ObjectId.is_valid(leg1_account_id):
                leg1_account = await db.db["trading_accounts"].find_one({"_id": ObjectId(leg1_account_id)})
                if leg1_account:
                    tiro_doc["leg1_accountNumber"] = leg1_account.get("accountNumber", "N/A")

        if tiro_doc["leg2"]["accounts"] and tiro_doc["leg2"]["accounts"][0]["accountId"]:
            leg2_account_id = tiro_doc["leg2"]["accounts"][0]["accountId"]
            if ObjectId.is_valid(leg2_account_id):
                leg2_account = await db.db["trading_accounts"].find_one({"_id": ObjectId(leg2_account_id)})
                if leg2_account:
                    tiro_doc["leg2_accountNumber"] = leg2_account.get("accountNumber", "N/A")

        tiros_list.append(TiroInDB.model_validate(tiro_doc))

    # 4. Calcular el resumen del ciclo
    total_cuentas = len(accounts_list)
    cuentas_por_fase = {
        "fase1": len([acc for acc in accounts_list if acc.phase == "fase1"]),
        "fase2": len([acc for acc in accounts_list if acc.phase == "fase2"]),
        "real": len([acc for acc in accounts_list if acc.phase == "real"]),
        "quemada": len([acc for acc in accounts_list if acc.phase == "quemada"]),
    }
    cuentas_en_real = cuentas_por_fase["real"]
    tasa_conversion = (cuentas_en_real / total_cuentas * 100) if total_cuentas > 0 else 0
    
    # Calcular estadísticas de tiros
    total_tiros = len(tiros_list)
    tiros_abiertos = len([t for t in tiros_list if t.status == "Abierto"])
    tiros_cerrados = len([t for t in tiros_list if t.status == "Cerrado"])
    
    # Calcular resultado total de tiros cerrados
    resultado_total_tiros = sum([t.result for t in tiros_list if t.result is not None])

    # 5. Ordenar los resultados
    # Ordenamos cuentas por fase
    phase_order = {"real": 0, "fase2": 1, "fase1": 2, "quemada": 3}
    accounts_list.sort(key=lambda acc: phase_order.get(acc.phase, 4))
    
    # Ordenamos tiros por fecha (más recientes primero)
    tiros_list.sort(key=lambda t: t.openDate, reverse=True)

    # 6. Construir y devolver la respuesta completa
    
    # Serializar cuentas con el campo 'id' explícito
    cuentas_serializadas = []
    for acc in accounts_list:
        acc_dict = acc.model_dump()
        # Asegurar que 'id' esté presente
        if 'id' not in acc_dict and '_id' in acc_dict:
            acc_dict['id'] = acc_dict['_id']
        cuentas_serializadas.append(acc_dict)
    
    # Serializar tiros con el campo 'id' explícito
    tiros_serializados = []
    for tiro in tiros_list:
        tiro_dict = tiro.model_dump()
        # Asegurar que 'id' esté presente
        if 'id' not in tiro_dict and '_id' in tiro_dict:
            tiro_dict['id'] = tiro_dict['_id']
        tiros_serializados.append(tiro_dict)
    
    dashboard_data = {
        "metadata": CycleInDB.model_validate(convert_document(cycle_document)),
        "resumen": {
            "totalCuentas": total_cuentas,
            "cuentasPorFase": cuentas_por_fase,
            "cuentasEnReal": cuentas_en_real,
            "tasaConversion": round(tasa_conversion, 2),
            "totalTiros": total_tiros,
            "tirosAbiertos": tiros_abiertos,
            "tirosCerrados": tiros_cerrados,
            "resultadoTotalTiros": round(resultado_total_tiros, 2)
        },
        "cuentas": cuentas_serializadas,
        "tiros": tiros_serializados
    }

    return dashboard_data