from motor.motor_asyncio import AsyncIOMotorClient
import os

client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = client.agentos

async def log_action(prompt, result):
    await db.prompt_logs.insert_one({
        "prompt": prompt,
        "result": result,
        "status": result.get("status", "executed")
    })