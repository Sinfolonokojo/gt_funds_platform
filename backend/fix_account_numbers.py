"""
Script para corregir accountNumbers que son IDs de MongoDB en lugar de números reales
Ejecutar desde la carpeta backend: python fix_account_numbers.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import re

# Configuración de MongoDB
MONGO_URL = "mongodb://admin:password@localhost:27017"
DATABASE_NAME = "gt_funds"

async def is_mongodb_id(value: str) -> bool:
    """Verifica si un string parece ser un ID de MongoDB (24 caracteres hexadecimales)."""
    if not value:
        return False
    # Un ObjectId válido tiene exactamente 24 caracteres hexadecimales
    return bool(re.match(r'^[0-9a-fA-F]{24}$', value))

async def fix_account_numbers():
    """Encuentra y corrige cuentas con accountNumbers inválidos."""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 60)
    print("🔍 BUSCANDO CUENTAS CON ACCOUNT NUMBERS INVÁLIDOS...")
    print("=" * 60)
    
    # Buscar todas las cuentas
    accounts_cursor = db["trading_accounts"].find()
    problematic_accounts = []
    
    async for account in accounts_cursor:
        account_number = account.get("accountNumber", "")
        account_id = str(account["_id"])
        
        # Verificar si el accountNumber parece ser un ID de MongoDB
        if is_mongodb_id(account_number):
            prop_firm = account.get("propFirm", "Unknown")
            kyc_id = account.get("kycId", "Unknown")
            
            # Obtener info del KYC
            kyc = await db["kycs"].find_one({"_id": ObjectId(kyc_id)}) if kyc_id != "Unknown" else None
            kyc_name = kyc.get("name", "Unknown") if kyc else "Unknown"
            
            problematic_accounts.append({
                "id": account_id,
                "current_number": account_number,
                "prop_firm": prop_firm,
                "kyc_name": kyc_name,
                "kyc_id": kyc_id,
                "phase": account.get("phase", "Unknown"),
                "status": account.get("status", "Unknown")
            })
    
    if not problematic_accounts:
        print("✅ ¡No se encontraron cuentas con problemas!")
        client.close()
        return
    
    print(f"\n⚠️  Encontradas {len(problematic_accounts)} cuentas con accountNumbers inválidos:\n")
    
    for idx, acc in enumerate(problematic_accounts, 1):
        print(f"{idx}. ID: {acc['id']}")
        print(f"   AccountNumber actual: {acc['current_number']} ❌")
        print(f"   Prop Firm: {acc['prop_firm']}")
        print(f"   Cliente: {acc['kyc_name']}")
        print(f"   Fase: {acc['phase']} | Estado: {acc['status']}")
        print()
    
    print("=" * 60)
    print("OPCIONES DE CORRECCIÓN:")
    print("=" * 60)
    print("1. Generar números automáticos (FT-00001, FT-00002, etc.)")
    print("2. Ingresar números manualmente para cada cuenta")
    print("3. Cancelar (no hacer cambios)")
    print()
    
    choice = input("Selecciona una opción (1/2/3): ").strip()
    
    if choice == "1":
        # Generar números automáticos
        print("\n🔧 Generando números automáticos...")
        
        # Obtener el último número usado
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
        
        # Empezar desde el siguiente número
        next_number = max_number + 1
        
        for acc in problematic_accounts:
            new_number = f"FT-{next_number:05d}"
            
            result = await db["trading_accounts"].update_one(
                {"_id": ObjectId(acc["id"])},
                {"$set": {"accountNumber": new_number}}
            )
            
            if result.modified_count > 0:
                print(f"✅ {acc['current_number'][:8]}... → {new_number} (Cliente: {acc['kyc_name']})")
            else:
                print(f"❌ Error al actualizar cuenta {acc['id']}")
            
            next_number += 1
    
    elif choice == "2":
        # Ingresar manualmente
        print("\n✏️  Ingresa los nuevos números de cuenta:\n")
        
        for acc in problematic_accounts:
            print(f"Cuenta ID: {acc['id']}")
            print(f"Cliente: {acc['kyc_name']} | Prop Firm: {acc['prop_firm']}")
            print(f"Actual: {acc['current_number']} ❌")
            
            while True:
                new_number = input(f"Nuevo número (ej: FT-12345): ").strip()
                
                if not new_number:
                    print("⚠️  No puede estar vacío. Intenta de nuevo.")
                    continue
                
                # Verificar que no exista ya
                existing = await db["trading_accounts"].find_one({"accountNumber": new_number})
                if existing:
                    print(f"⚠️  El número {new_number} ya existe. Usa otro.")
                    continue
                
                break
            
            result = await db["trading_accounts"].update_one(
                {"_id": ObjectId(acc["id"])},
                {"$set": {"accountNumber": new_number}}
            )
            
            if result.modified_count > 0:
                print(f"✅ Actualizado a: {new_number}\n")
            else:
                print(f"❌ Error al actualizar\n")
    
    else:
        print("\n❌ Operación cancelada. No se realizaron cambios.")
        client.close()
        return
    
    print("\n" + "=" * 60)
    print("✅ CORRECCIÓN COMPLETADA")
    print("=" * 60)
    
    # Verificar que todo esté bien
    print("\n🔍 Verificando cambios...")
    remaining_problems = 0
    async for account in db["trading_accounts"].find():
        if is_mongodb_id(account.get("accountNumber", "")):
            remaining_problems += 1
    
    if remaining_problems == 0:
        print("✅ Todas las cuentas ahora tienen números válidos!")
    else:
        print(f"⚠️  Aún hay {remaining_problems} cuentas con problemas.")
    
    client.close()

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════╗
    ║   FIX ACCOUNT NUMBERS - GT FUNDS                      ║
    ║   Corrector de Números de Cuenta Inválidos           ║
    ╚═══════════════════════════════════════════════════════╝
    """)
    
    asyncio.run(fix_account_numbers())