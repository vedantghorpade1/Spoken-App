import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).with_name(".env"))

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "speakai")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL is not configured. Add it to backend/.env.")

client = AsyncIOMotorClient(MONGO_URL)
database = client[DATABASE_NAME]


def get_database():
    return database
