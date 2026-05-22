import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated

from bson import ObjectId
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from pymongo import ReturnDocument

from database import get_database
from jwt_handler import create_access_token, decode_access_token
from matchmaking import create_agora_token, create_channel_name, create_visitor_uid

load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="SpeakAI API")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class MatchRequestResponse(BaseModel):
    match_id: str
    status: str
    channel_name: str | None = None
    agora_token: str | None = None
    uid: int | None = None
    partner: UserResponse | None = None
    compatibility_score: int | None = None


class MatchStatusResponse(MatchRequestResponse):
    pass


def serialize_user(user: dict) -> UserResponse:
    return UserResponse(id=str(user["_id"]), name=user["name"], email=user["email"])


def serialize_partner(user: dict | None) -> UserResponse | None:
    if not user:
        return None

    return serialize_user(user)


async def build_match_response(match: dict, current_user: dict) -> MatchStatusResponse:
    current_user_id = current_user["_id"]
    current_user_key = str(current_user_id)
    partner_id = match.get("user_a_id") if match.get("user_b_id") == current_user_id else match.get("user_b_id")
    partner = None

    if partner_id:
        partner = await get_database().users.find_one({"_id": partner_id})

    uid_map = match.get("uids", {})
    uid = uid_map.get(current_user_key)
    channel_name = match.get("channel_name")
    agora_token = create_agora_token(channel_name, uid) if channel_name and uid else None

    return MatchStatusResponse(
        match_id=str(match["_id"]),
        status=match["status"],
        channel_name=channel_name if match["status"] == "matched" else None,
        agora_token=agora_token,
        uid=uid,
        partner=serialize_partner(partner),
        compatibility_score=match.get("compatibility_score"),
    )


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


async def get_current_user(authorization: Annotated[str | None, Header()] = None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    token = authorization.replace("Bearer ", "", 1)
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from None

    if not user_id or not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    database = get_database()
    user = await database.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


@app.get("/")
def home():
    return {"message": "Backend Running Successfully"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "database_configured": bool(os.getenv("MONGO_URL")),
        "jwt_configured": bool(os.getenv("JWT_SECRET")),
        "algorithm": os.getenv("ALGORITHM", "HS256"),
    }


@app.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    database = get_database()
    email = payload.email.lower()
    existing_user = await database.users.find_one({"email": email})

    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    result = await database.users.insert_one(
        {
            "name": payload.name.strip(),
            "email": email,
            "hashed_password": hash_password(payload.password),
        }
    )
    user = await database.users.find_one({"_id": result.inserted_id})
    token = create_access_token({"sub": str(result.inserted_id)})

    return AuthResponse(token=token, user=serialize_user(user))


@app.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    database = get_database()
    user = await database.users.find_one({"email": payload.email.lower()})

    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"])})
    return AuthResponse(token=token, user=serialize_user(user))


@app.get("/profile", response_model=UserResponse)
async def profile(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)


@app.post("/matchmaking/request", response_model=MatchRequestResponse)
async def request_match(current_user: dict = Depends(get_current_user)):
    database = get_database()
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(seconds=45)

    await database.voice_matches.delete_many(
        {
            "status": "waiting",
            "expires_at": {"$lt": now},
        }
    )

    current_user_id = current_user["_id"]

    existing = await database.voice_matches.find_one(
        {
            "status": {"$in": ["waiting", "matched"]},
            "$or": [{"user_a_id": current_user_id}, {"user_b_id": current_user_id}],
        },
        sort=[("created_at", -1)],
    )

    if existing:
        return await build_match_response(existing, current_user)

    waiting = await database.voice_matches.find_one_and_update(
        {
            "status": "waiting",
            "user_a_id": {"$ne": current_user_id},
            "expires_at": {"$gt": now},
        },
        {
            "$set": {
                "status": "matched",
                "user_b_id": current_user_id,
                "matched_at": now,
                "channel_name": create_channel_name(),
                "compatibility_score": 84 + secrets.randbelow(15),
            },
        },
        sort=[("created_at", 1)],
        return_document=ReturnDocument.AFTER,
    )

    if waiting:
        uids = {
            str(waiting["user_a_id"]): create_visitor_uid(),
            str(current_user_id): create_visitor_uid(),
        }
        await database.voice_matches.update_one({"_id": waiting["_id"]}, {"$set": {"uids": uids}})
        matched = await database.voice_matches.find_one({"_id": waiting["_id"]})
        return await build_match_response(matched, current_user)

    result = await database.voice_matches.insert_one(
        {
            "status": "waiting",
            "user_a_id": current_user_id,
            "user_b_id": None,
            "channel_name": None,
            "compatibility_score": None,
            "uids": {str(current_user_id): create_visitor_uid()},
            "created_at": now,
            "expires_at": expires_at,
        }
    )
    match = await database.voice_matches.find_one({"_id": result.inserted_id})
    return await build_match_response(match, current_user)


@app.get("/matchmaking/{match_id}", response_model=MatchStatusResponse)
async def get_match_status(match_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid match id")

    database = get_database()
    current_user_id = current_user["_id"]
    match = await database.voice_matches.find_one(
        {
            "_id": ObjectId(match_id),
            "$or": [{"user_a_id": current_user_id}, {"user_b_id": current_user_id}],
        }
    )

    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    return await build_match_response(match, current_user)


@app.post("/matchmaking/{match_id}/leave")
async def leave_match(match_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(match_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid match id")

    database = get_database()
    current_user_id = current_user["_id"]
    result = await database.voice_matches.update_one(
        {
            "_id": ObjectId(match_id),
            "$or": [{"user_a_id": current_user_id}, {"user_b_id": current_user_id}],
        },
        {
            "$set": {
                "status": "ended",
                "ended_at": datetime.now(timezone.utc),
                "ended_by": current_user_id,
            }
        },
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    return {"status": "ended"}
