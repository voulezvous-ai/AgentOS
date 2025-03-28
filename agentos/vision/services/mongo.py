
from pymongo import MongoClient

def get_latest_events():
    client = MongoClient("mongodb://localhost:27017/")
    db = client["agentos"]
    collection = db["events"]
    return list(collection.find().sort("timestamp", -1).limit(10))
