# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Importar todos los routers
from .api import kycs, cycles, tiros, investors, auth
from .api.trading_accounts import nested_router as nested_accounts_router
from .api.trading_accounts import direct_router as direct_accounts_router
from .api.payouts import nested_router as nested_payouts_router
from .api.payouts import direct_router as direct_payouts_router
from .database import init_indexes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database indexes
    await init_indexes()
    yield
    # Shutdown: Cleanup (if needed)

app = FastAPI(
    title="GT Funds API",
    description="API para la gestión de cuentas de trading y operaciones.",
    version="0.3.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE ROUTERS ---

# 0. Auth routes (no prefix needed for /auth)
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])

# 1. Rutas "Top-Level" (generales)
app.include_router(cycles.router, prefix="/api/v1/cycles", tags=["Cycles"])
app.include_router(kycs.router, prefix="/api/v1/kycs", tags=["KYC"])
app.include_router(direct_accounts_router, prefix="/api/v1/accounts", tags=["Trading Accounts"])
app.include_router(direct_payouts_router, prefix="/api/v1/payouts", tags=["Payouts"])
app.include_router(tiros.router, prefix="/api/v1/tiros", tags=["Tiros"])
app.include_router(investors.router, prefix="/api/v1/investors", tags=["Investors"])

# 2. Rutas "Anidadas" (específicas)
app.include_router(nested_accounts_router, prefix="/api/v1/kycs/{kyc_id}/accounts", tags=["Trading Accounts (Anidado)"])
app.include_router(nested_payouts_router, prefix="/api/v1/kycs/{kyc_id}/payouts", tags=["Payouts (Anidado)"])

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de GT Funds", "version": "0.3.0"}

@app.get("/api/v1/helper/ids")
async def get_sample_ids():
    """
    Endpoint helper para obtener IDs de ejemplo para crear un Tiro.
    Este endpoint es temporal y solo para desarrollo.
    """
    from .database import db
    
    # Obtener un ciclo activo
    cycle = await db["cycles"].find_one({"status": "Activo"})
    
    # Obtener dos cuentas diferentes
    accounts_cursor = db["trading_accounts"].find().limit(2)
    accounts = []
    async for acc in accounts_cursor:
        accounts.append(acc)
    
    if not cycle:
        return {"error": "No hay ciclos activos. Crea un ciclo primero."}
    
    if len(accounts) < 2:
        return {"error": "Necesitas al menos 2 cuentas. Crea más cuentas."}
    
    return {
        "message": "Usa estos IDs para crear un tiro de prueba",
        "cycleId": str(cycle["_id"]),
        "cycleName": cycle.get("name"),
        "account1": {
            "id": str(accounts[0]["_id"]),
            "accountNumber": accounts[0].get("accountNumber"),
            "propFirm": accounts[0].get("propFirm")
        },
        "account2": {
            "id": str(accounts[1]["_id"]),
            "accountNumber": accounts[1].get("accountNumber"),
            "propFirm": accounts[1].get("propFirm")
        },
        "exampleJSON": {
            "cycleId": str(cycle["_id"]),
            "symbol": "EURUSD",
            "status": "Abierto",
            "leg1": {
                "accountId": str(accounts[0]["_id"]),
                "direction": "BUY",
                "volume": 1.0
            },
            "leg2": {
                "accountId": str(accounts[1]["_id"]),
                "direction": "SELL",
                "volume": 1.0
            },
            "notes": "Tiro de prueba"
        }
    }

@app.get("/api/v1/helper/fix-account-numbers")
async def fix_invalid_account_numbers():
    """
    Endpoint helper para identificar y sugerir correcciones para accountNumbers inválidos.
    SOLO lectura - no modifica nada.
    """
    from .database import db
    from bson import ObjectId
    import re
    
    def is_mongodb_id(value: str) -> bool:
        if not value:
            return False
        return bool(re.match(r'^[0-9a-fA-F]{24}$', value))
    
    problematic_accounts = []
    accounts_cursor = db["trading_accounts"].find()
    
    async for account in accounts_cursor:
        account_number = account.get("accountNumber", "")
        
        if is_mongodb_id(account_number):
            kyc = await db["kycs"].find_one({"_id": ObjectId(account.get("kycId"))})
            
            problematic_accounts.append({
                "id": str(account["_id"]),
                "current_accountNumber": account_number,
                "propFirm": account.get("propFirm"),
                "kycName": kyc.get("name") if kyc else "Unknown",
                "phase": account.get("phase"),
                "status": account.get("status")
            })
    
    if not problematic_accounts:
        return {
            "status": "ok",
            "message": "✅ No se encontraron cuentas con accountNumbers inválidos",
            "count": 0
        }
    
    # Generar sugerencias de números automáticos
    all_accounts = db["trading_accounts"].find()
    max_number = 0
    async for acc in all_accounts:
        acc_num = acc.get("accountNumber", "")
        if acc_num.startswith("FT-"):
            try:
                num = int(acc_num.replace("FT-", ""))
                max_number = max(max_number, num)
            except:
                pass
    
    next_number = max_number + 1
    
    for acc in problematic_accounts:
        acc["suggested_new_number"] = f"FT-{next_number:05d}"
        next_number += 1
    
    return {
        "status": "warning",
        "message": f"⚠️  Encontradas {len(problematic_accounts)} cuentas con accountNumbers inválidos",
        "count": len(problematic_accounts),
        "accounts": problematic_accounts,
        "instructions": "Usa el script fix_account_numbers.py o corrige manualmente desde la interfaz de KYC"
    }