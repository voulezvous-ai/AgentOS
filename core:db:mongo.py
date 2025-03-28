from pymongo import MongoClient
import os

def get_db():
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        raise RuntimeError("Variável MONGO_URL não definida.")
    
    client = MongoClient(mongo_url)
    return client["agentos"]

def get_collection(name: str):
    db = get_db()
    return db[name]