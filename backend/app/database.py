# app/database.py
import motor.motor_asyncio
from .core.config import settings

client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URL)
db = client[settings.DATABASE_NAME]

async def init_indexes():
    """Initialize database indexes for better query performance."""

    # Trading accounts indexes
    await db["trading_accounts"].create_index("cycleId")
    await db["trading_accounts"].create_index("kycId")
    await db["trading_accounts"].create_index("status")
    await db["trading_accounts"].create_index([("cycleId", 1), ("phase", 1)])

    # Payouts indexes
    await db["payouts"].create_index("kycId")

    # Tiros indexes
    await db["tiros"].create_index("cycleId")
    await db["tiros"].create_index("status")

    # Cycles indexes
    await db["cycles"].create_index("status")

    # KYCs indexes
    await db["kycs"].create_index("email", unique=True)
    await db["kycs"].create_index("name")
    await db["kycs"].create_index([("name", "text"), ("email", "text")])

    # Investors indexes
    await db["investors"].create_index("email", unique=True)

    print("Database indexes initialized successfully")