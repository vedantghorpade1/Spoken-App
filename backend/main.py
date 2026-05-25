import os
import secrets
import sqlite3
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Annotated, Any

import socketio
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field

from jwt_handler import create_access_token, decode_access_token
from matchmaking import create_agora_token, create_channel_name, create_visitor_uid

load_dotenv(Path(__file__).with_name(".env"))

DATABASE_PATH = Path(os.getenv("SQLITE_PATH", Path(__file__).with_name("speakai.sqlite3")))
AGORA_TOKEN_REFRESH_SECONDS = int(os.getenv("AGORA_TOKEN_REFRESH_SECONDS", "3300"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*", logger=False, engineio_logger=False)
fastapi_app = FastAPI(title="SpeakAI Voice API")
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

online_users: dict[str, str] = {}
socket_users: dict[str, str] = {}
matchmaking_queue: list[str] = []


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_iso() -> str:
    return date.today().isoformat()


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                stars INTEGER NOT NULL DEFAULT 0,
                streak_count INTEGER NOT NULL DEFAULT 0,
                last_speaking_date TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS friendships (
                user_id TEXT NOT NULL,
                friend_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                PRIMARY KEY (user_id, friend_id)
            );

            CREATE TABLE IF NOT EXISTS calls (
                id TEXT PRIMARY KEY,
                caller_id TEXT NOT NULL,
                receiver_id TEXT NOT NULL,
                channel_name TEXT NOT NULL,
                call_type TEXT NOT NULL,
                status TEXT NOT NULL,
                caller_uid INTEGER NOT NULL,
                receiver_uid INTEGER NOT NULL,
                started_at TEXT,
                ended_at TEXT,
                created_at TEXT NOT NULL,
                duration INTEGER NOT NULL DEFAULT 0,
                ended_by TEXT
            );

            CREATE TABLE IF NOT EXISTS user_progress (
                user_id TEXT PRIMARY KEY,
                stars INTEGER NOT NULL DEFAULT 0,
                streak_count INTEGER NOT NULL DEFAULT 0,
                last_speaking_date TEXT,
                weekly_duration INTEGER NOT NULL DEFAULT 0,
                week_start TEXT
            );

            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY,
                host_id TEXT NOT NULL,
                title TEXT NOT NULL,
                topic TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL,
                level TEXT NOT NULL,
                tags TEXT NOT NULL DEFAULT '',
                room_type TEXT NOT NULL,
                max_participants INTEGER NOT NULL DEFAULT 24,
                allow_listeners INTEGER NOT NULL DEFAULT 1,
                speaker_approval INTEGER NOT NULL DEFAULT 1,
                recording_enabled INTEGER NOT NULL DEFAULT 0,
                ai_moderation_enabled INTEGER NOT NULL DEFAULT 1,
                image TEXT,
                channel_name TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS room_participants (
                room_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                muted INTEGER NOT NULL DEFAULT 0,
                speaking INTEGER NOT NULL DEFAULT 0,
                raised_hand INTEGER NOT NULL DEFAULT 0,
                joined_at TEXT NOT NULL,
                left_at TEXT,
                PRIMARY KEY (room_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS room_messages (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                text TEXT NOT NULL,
                kind TEXT NOT NULL DEFAULT 'message',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS room_invites (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                inviter_id TEXT NOT NULL,
                invitee_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS room_reactions (
                id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS room_analytics (
                user_id TEXT PRIMARY KEY,
                speaking_time INTEGER NOT NULL DEFAULT 0,
                rooms_joined INTEGER NOT NULL DEFAULT 0,
                rooms_hosted INTEGER NOT NULL DEFAULT 0,
                average_confidence INTEGER NOT NULL DEFAULT 0,
                speaking_streak INTEGER NOT NULL DEFAULT 0
            );
            """
        )


@fastapi_app.on_event("startup")
def startup() -> None:
    init_db()


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


class CallParticipant(BaseModel):
    id: str
    name: str
    email: EmailStr


class CallRoomResponse(BaseModel):
    call_id: str
    channel_name: str
    agora_token: str | None
    uid: int
    partner: CallParticipant
    call_type: str
    status: str


class CallCreateRequest(BaseModel):
    receiver_id: str
    call_type: str = "friend"


class CallEndRequest(BaseModel):
    call_id: str
    duration: int = Field(default=0, ge=0)


class MatchmakingResponse(BaseModel):
    status: str
    call: CallRoomResponse | None = None


class RoomCreateRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    topic: str = Field(min_length=3, max_length=180)
    description: str = Field(default="", max_length=600)
    category: str = Field(default="Casual Talk", max_length=60)
    level: str = Field(default="B2", max_length=16)
    tags: list[str] = Field(default_factory=list)
    image: str | None = None
    type: str = Field(default="open", pattern="^(open|private|friends|scheduled)$")
    maxParticipants: int = Field(default=24, ge=2, le=200)
    allowListeners: bool = True
    speakerApproval: bool = True
    recordingEnabled: bool = False
    aiModerationEnabled: bool = True


class RoomJoinRequest(BaseModel):
    room_id: str


class RoomLeaveRequest(BaseModel):
    room_id: str
    duration: int = Field(default=0, ge=0)


class RoomUserActionRequest(BaseModel):
    room_id: str
    user_id: str | None = None


class AgoraTokenRequest(BaseModel):
    channel_name: str
    uid: int = Field(default=0, ge=0)


class RoomParticipantResponse(BaseModel):
    id: str
    name: str
    initials: str
    role: str
    level: str
    muted: bool
    speaking: bool
    raised_hand: bool = False


class LiveRoomResponse(BaseModel):
    id: str
    title: str
    topic: str
    description: str
    category: str
    level: str
    type: str
    host: RoomParticipantResponse
    participants: list[RoomParticipantResponse]
    speakers: int
    listeners: int
    tags: list[str]
    is_live: bool
    is_followed: bool = False
    channel_name: str
    agora_token: str | None = None
    uid: int | None = None
    started_at: str


def row_to_user(row: sqlite3.Row) -> UserResponse:
    return UserResponse(id=row["id"], name=row["name"], email=row["email"])


def row_to_participant(row: sqlite3.Row) -> CallParticipant:
    return CallParticipant(id=row["id"], name=row["name"], email=row["email"])


def initials_for(name: str) -> str:
    parts = [part for part in name.strip().split(" ") if part]
    return "".join(part[0] for part in parts[:2]).upper() or "SA"


def ensure_room_analytics(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM room_analytics WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        return row
    conn.execute("INSERT INTO room_analytics (user_id) VALUES (?)", (user_id,))
    return conn.execute("SELECT * FROM room_analytics WHERE user_id = ?", (user_id,)).fetchone()


def room_participant_response(row: sqlite3.Row) -> RoomParticipantResponse:
    return RoomParticipantResponse(
        id=row["user_id"],
        name=row["name"],
        initials=initials_for(row["name"]),
        role=row["role"],
        level=row["level"] if "level" in row.keys() else "B2",
        muted=bool(row["muted"]),
        speaking=bool(row["speaking"]),
        raised_hand=bool(row["raised_hand"]),
    )


def build_room_response(room: sqlite3.Row, current_user_id: str | None = None, include_token: bool = False) -> LiveRoomResponse:
    with get_conn() as conn:
        participant_rows = conn.execute(
            """
            SELECT rp.*, u.name, COALESCE(r.level, 'B2') AS level
            FROM room_participants rp
            JOIN users u ON u.id = rp.user_id
            JOIN rooms r ON r.id = rp.room_id
            WHERE rp.room_id = ? AND rp.left_at IS NULL
            ORDER BY CASE rp.role WHEN 'host' THEN 0 WHEN 'moderator' THEN 1 WHEN 'speaker' THEN 2 ELSE 3 END, rp.joined_at
            """,
            (room["id"],),
        ).fetchall()
        host_row = next((participant for participant in participant_rows if participant["role"] == "host"), None)
        if not host_row:
            host_row = conn.execute(
                """
                SELECT rp.*, u.name, COALESCE(r.level, 'B2') AS level
                FROM room_participants rp
                JOIN users u ON u.id = rp.user_id
                JOIN rooms r ON r.id = rp.room_id
                WHERE rp.room_id = ? AND rp.user_id = ?
                """,
                (room["id"], room["host_id"]),
            ).fetchone()
    participants = [room_participant_response(row) for row in participant_rows]
    host = room_participant_response(host_row) if host_row else RoomParticipantResponse(
        id=room["host_id"],
        name="Host",
        initials="HO",
        role="host",
        level=room["level"],
        muted=False,
        speaking=True,
    )
    uid = create_visitor_uid() if include_token else None
    return LiveRoomResponse(
        id=room["id"],
        title=room["title"],
        topic=room["topic"],
        description=room["description"],
        category=room["category"],
        level=room["level"],
        type=room["room_type"],
        host=host,
        participants=participants,
        speakers=len([participant for participant in participants if participant.role in {"host", "moderator", "speaker"}]),
        listeners=len([participant for participant in participants if participant.role == "listener"]),
        tags=[tag for tag in room["tags"].split(",") if tag],
        is_live=room["status"] == "live",
        is_followed=False,
        channel_name=room["channel_name"],
        agora_token=create_agora_token(room["channel_name"], uid) if include_token and uid is not None else None,
        uid=uid,
        started_at=room["started_at"],
    )


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def auth_user_from_token(token: str) -> sqlite3.Row | None:
    try:
        payload = decode_access_token(token)
    except JWTError:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    with get_conn() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


async def get_current_user(authorization: Annotated[str | None, Header()] = None) -> sqlite3.Row:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    user = auth_user_from_token(authorization.replace("Bearer ", "", 1))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    return user


def build_call_response(call: sqlite3.Row, current_user_id: str) -> CallRoomResponse:
    partner_id = call["receiver_id"] if call["caller_id"] == current_user_id else call["caller_id"]
    uid = call["caller_uid"] if call["caller_id"] == current_user_id else call["receiver_uid"]
    with get_conn() as conn:
        partner = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (partner_id,)).fetchone()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call partner not found")
    return CallRoomResponse(
        call_id=call["id"],
        channel_name=call["channel_name"],
        agora_token=create_agora_token(call["channel_name"], uid),
        uid=uid,
        partner=row_to_participant(partner),
        call_type=call["call_type"],
        status=call["status"],
    )


def ensure_progress(conn: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM user_progress WHERE user_id = ?", (user_id,)).fetchone()
    if row:
        return row
    week_start = date.today().isoformat()
    conn.execute(
        "INSERT INTO user_progress (user_id, stars, streak_count, weekly_duration, week_start) VALUES (?, 0, 0, 0, ?)",
        (user_id, week_start),
    )
    return conn.execute("SELECT * FROM user_progress WHERE user_id = ?", (user_id,)).fetchone()


def update_progress_for_call(conn: sqlite3.Connection, user_id: str, duration: int) -> None:
    progress = ensure_progress(conn, user_id)
    current_day = today_iso()
    last_day = progress["last_speaking_date"]
    streak = progress["streak_count"]
    if last_day != current_day:
        if last_day:
            last_date = date.fromisoformat(last_day)
            streak = streak + 1 if (date.today() - last_date).days == 1 else 1
        else:
            streak = 1
    stars = progress["stars"] + max(1, duration // 60)
    week_start = progress["week_start"] or current_day
    weekly_duration = progress["weekly_duration"] + duration
    conn.execute(
        """
        UPDATE user_progress
        SET stars = ?, streak_count = ?, last_speaking_date = ?, weekly_duration = ?, week_start = ?
        WHERE user_id = ?
        """,
        (stars, streak, current_day, weekly_duration, week_start, user_id),
    )
    conn.execute(
        "UPDATE users SET stars = ?, streak_count = ?, last_speaking_date = ? WHERE id = ?",
        (stars, streak, current_day, user_id),
    )


def create_call(caller_id: str, receiver_id: str, call_type: str, status_value: str) -> sqlite3.Row:
    if caller_id == receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot call yourself")
    call_id = secrets.token_urlsafe(16)
    channel_name = create_channel_name()
    now = utcnow()
    with get_conn() as conn:
        receiver = conn.execute("SELECT id FROM users WHERE id = ?", (receiver_id,)).fetchone()
        if not receiver:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receiver not found")
        conn.execute(
            """
            INSERT INTO calls
            (id, caller_id, receiver_id, channel_name, call_type, status, caller_uid, receiver_uid, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (call_id, caller_id, receiver_id, channel_name, call_type, status_value, create_visitor_uid(), create_visitor_uid(), now),
        )
        return conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()


async def emit_to_user(user_id: str, event: str, data: dict[str, Any]) -> None:
    sid = online_users.get(user_id)
    if sid:
        await sio.emit(event, data, to=sid)


async def emit_call_to_participants(call: sqlite3.Row, event: str, extra: dict[str, Any] | None = None) -> None:
    for user_id in [call["caller_id"], call["receiver_id"]]:
        payload = build_call_response(call, user_id).model_dump()
        if extra:
            payload.update(extra)
        await emit_to_user(user_id, event, payload)


@fastapi_app.get("/")
def home():
    return {"message": "SpeakAI voice backend running"}


@fastapi_app.get("/health")
def health():
    return {
        "status": "ok",
        "database": str(DATABASE_PATH),
        "agora_configured": bool(os.getenv("AGORA_APP_ID") and os.getenv("AGORA_APP_CERTIFICATE")),
    }


@fastapi_app.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    user_id = secrets.token_urlsafe(12)
    email = payload.email.lower()
    with get_conn() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
        conn.execute(
            "INSERT INTO users (id, name, email, hashed_password, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, payload.name.strip(), email, hash_password(payload.password), utcnow()),
        )
        user = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    token = create_access_token({"sub": user_id})
    return AuthResponse(token=token, user=row_to_user(user))


@fastapi_app.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    with get_conn() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (payload.email.lower(),)).fetchone()
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return AuthResponse(token=create_access_token({"sub": user["id"]}), user=row_to_user(user))


@fastapi_app.get("/profile", response_model=UserResponse)
async def profile(current_user: sqlite3.Row = Depends(get_current_user)):
    return row_to_user(current_user)


@fastapi_app.post("/matchmaking/join", response_model=MatchmakingResponse)
async def matchmaking_join(current_user: sqlite3.Row = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id in matchmaking_queue:
        return MatchmakingResponse(status="waiting")

    active_call = None
    with get_conn() as conn:
        active_call = conn.execute(
            """
            SELECT * FROM calls
            WHERE status IN ('ringing', 'active')
            AND (caller_id = ? OR receiver_id = ?)
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_id, user_id),
        ).fetchone()
    if active_call:
        return MatchmakingResponse(status=active_call["status"], call=build_call_response(active_call, user_id))

    partner_id = next((queued for queued in matchmaking_queue if queued != user_id and queued in online_users), None)
    if not partner_id:
        matchmaking_queue.append(user_id)
        return MatchmakingResponse(status="waiting")

    matchmaking_queue.remove(partner_id)
    call = create_call(partner_id, user_id, "random", "active")
    with get_conn() as conn:
        conn.execute("UPDATE calls SET started_at = ? WHERE id = ?", (utcnow(), call["id"]))
        call = conn.execute("SELECT * FROM calls WHERE id = ?", (call["id"],)).fetchone()
    await emit_call_to_participants(call, "matchmaking_found")
    return MatchmakingResponse(status="matched", call=build_call_response(call, user_id))


@fastapi_app.get("/matchmaking/status", response_model=MatchmakingResponse)
async def matchmaking_status(current_user: sqlite3.Row = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_conn() as conn:
        call = conn.execute(
            """
            SELECT * FROM calls
            WHERE call_type = 'random' AND status = 'active'
            AND (caller_id = ? OR receiver_id = ?)
            ORDER BY created_at DESC LIMIT 1
            """,
            (user_id, user_id),
        ).fetchone()
    if call:
        return MatchmakingResponse(status="matched", call=build_call_response(call, user_id))
    return MatchmakingResponse(status="waiting" if user_id in matchmaking_queue else "idle")


@fastapi_app.post("/matchmaking/leave")
async def matchmaking_leave(current_user: sqlite3.Row = Depends(get_current_user)):
    user_id = current_user["id"]
    if user_id in matchmaking_queue:
        matchmaking_queue.remove(user_id)
    return {"status": "left"}


@fastapi_app.post("/call/create", response_model=CallRoomResponse)
async def call_create(payload: CallCreateRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    call = create_call(current_user["id"], payload.receiver_id, payload.call_type, "ringing")
    await emit_to_user(payload.receiver_id, "incoming_call", build_call_response(call, payload.receiver_id).model_dump())
    return build_call_response(call, current_user["id"])


@fastapi_app.post("/call/end")
async def call_end(payload: CallEndRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        call = conn.execute(
            "SELECT * FROM calls WHERE id = ? AND (caller_id = ? OR receiver_id = ?)",
            (payload.call_id, current_user["id"], current_user["id"]),
        ).fetchone()
        if not call:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
        duration = max(payload.duration, call["duration"] or 0)
        conn.execute(
            "UPDATE calls SET status = 'ended', ended_at = ?, duration = ?, ended_by = ? WHERE id = ?",
            (utcnow(), duration, current_user["id"], payload.call_id),
        )
        update_progress_for_call(conn, call["caller_id"], duration)
        update_progress_for_call(conn, call["receiver_id"], duration)
        ended_call = conn.execute("SELECT * FROM calls WHERE id = ?", (payload.call_id,)).fetchone()
    await emit_call_to_participants(ended_call, "call_ended", {"duration": duration})
    return {"status": "ended", "duration": duration}


@fastapi_app.get("/friends/online", response_model=list[CallParticipant])
async def online_friends(current_user: sqlite3.Row = Depends(get_current_user), include_all: bool = Query(default=True)):
    with get_conn() as conn:
        if include_all:
            rows = conn.execute(
                "SELECT id, name, email FROM users WHERE id != ? ORDER BY name LIMIT 50",
                (current_user["id"],),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT u.id, u.name, u.email FROM friendships f
                JOIN users u ON u.id = f.friend_id
                WHERE f.user_id = ?
                ORDER BY u.name
                """,
                (current_user["id"],),
            ).fetchall()
    return [row_to_participant(row) for row in rows if row["id"] in online_users]


def seed_demo_rooms(conn: sqlite3.Connection, current_user: sqlite3.Row) -> None:
    existing = conn.execute("SELECT id FROM rooms WHERE status = 'live' LIMIT 1").fetchone()
    if existing:
        return
    now = utcnow()
    demo_specs = [
        ("Daily fluency lounge", "Talk about work, routines, and small wins", "Casual Talk", "B1-B2", "fluency,confidence,daily"),
        ("IELTS speaking sprint", "Cue cards, follow-ups, and band 7 answers", "IELTS", "B2-C1", "ielts,exam,speaking"),
        ("Startup pitch practice", "Explain ideas clearly with sharper vocabulary", "Startup Talks", "B2", "startup,pitch,clarity"),
        ("Pronunciation clinic", "Fix stress, rhythm, and difficult sounds", "Pronunciation", "Mixed", "pronunciation,accent,feedback"),
    ]
    for title, topic, category, level, tags in demo_specs:
        room_id = secrets.token_urlsafe(12)
        conn.execute(
            """
            INSERT INTO rooms
            (id, host_id, title, topic, description, category, level, tags, room_type, channel_name, status, started_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, 'live', ?, ?)
            """,
            (room_id, current_user["id"], title, topic, "A live SpeakAI community room.", category, level, tags, create_channel_name(), now, now),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO room_participants (room_id, user_id, role, muted, speaking, joined_at)
            VALUES (?, ?, 'host', 0, 1, ?)
            """,
            (room_id, current_user["id"], now),
        )


@fastapi_app.get("/rooms/live", response_model=list[LiveRoomResponse])
async def rooms_live(category: str | None = Query(default=None), current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        seed_demo_rooms(conn, current_user)
        if category:
            rows = conn.execute(
                "SELECT * FROM rooms WHERE status = 'live' AND category = ? ORDER BY started_at DESC LIMIT 50",
                (category,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM rooms WHERE status = 'live' ORDER BY started_at DESC LIMIT 50").fetchall()
    return [build_room_response(row, current_user["id"]) for row in rows]


@fastapi_app.get("/rooms/trending", response_model=list[LiveRoomResponse])
async def rooms_trending(current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        seed_demo_rooms(conn, current_user)
        rows = conn.execute(
            """
            SELECT r.*, COUNT(rp.user_id) AS participant_count
            FROM rooms r
            LEFT JOIN room_participants rp ON rp.room_id = r.id AND rp.left_at IS NULL
            WHERE r.status = 'live'
            GROUP BY r.id
            ORDER BY participant_count DESC, r.started_at DESC
            LIMIT 20
            """
        ).fetchall()
    return [build_room_response(row, current_user["id"]) for row in rows]


@fastapi_app.post("/rooms/create", response_model=LiveRoomResponse)
async def rooms_create(payload: RoomCreateRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    room_id = secrets.token_urlsafe(12)
    now = utcnow()
    channel_name = create_channel_name()
    tags = ",".join(tag.strip() for tag in payload.tags if tag.strip())
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO rooms
            (id, host_id, title, topic, description, category, level, tags, room_type, max_participants,
             allow_listeners, speaker_approval, recording_enabled, ai_moderation_enabled, image, channel_name, status, started_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, ?)
            """,
            (
                room_id,
                current_user["id"],
                payload.name.strip(),
                payload.topic.strip(),
                payload.description.strip(),
                payload.category,
                payload.level,
                tags,
                payload.type,
                payload.maxParticipants,
                int(payload.allowListeners),
                int(payload.speakerApproval),
                int(payload.recordingEnabled),
                int(payload.aiModerationEnabled),
                payload.image,
                channel_name,
                now,
                now,
            ),
        )
        conn.execute(
            """
            INSERT INTO room_participants (room_id, user_id, role, muted, speaking, joined_at)
            VALUES (?, ?, 'host', 0, 1, ?)
            """,
            (room_id, current_user["id"], now),
        )
        analytics = ensure_room_analytics(conn, current_user["id"])
        conn.execute(
            "UPDATE room_analytics SET rooms_hosted = ?, rooms_joined = ?, average_confidence = ? WHERE user_id = ?",
            (analytics["rooms_hosted"] + 1, analytics["rooms_joined"] + 1, max(analytics["average_confidence"], 84), current_user["id"]),
        )
        room = conn.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    await sio.emit("room_created", {"room_id": room_id, "title": payload.name})
    return build_room_response(room, current_user["id"], include_token=True)


@fastapi_app.post("/rooms/join", response_model=LiveRoomResponse)
async def rooms_join(payload: RoomJoinRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    now = utcnow()
    with get_conn() as conn:
        room = conn.execute("SELECT * FROM rooms WHERE id = ? AND status = 'live'", (payload.room_id,)).fetchone()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
        role = "host" if room["host_id"] == current_user["id"] else "listener"
        conn.execute(
            """
            INSERT INTO room_participants (room_id, user_id, role, muted, speaking, raised_hand, joined_at, left_at)
            VALUES (?, ?, ?, 0, 0, 0, ?, NULL)
            ON CONFLICT(room_id, user_id) DO UPDATE SET left_at = NULL, role = excluded.role
            """,
            (payload.room_id, current_user["id"], role, now),
        )
        analytics = ensure_room_analytics(conn, current_user["id"])
        conn.execute(
            "UPDATE room_analytics SET rooms_joined = ?, average_confidence = ? WHERE user_id = ?",
            (analytics["rooms_joined"] + 1, max(analytics["average_confidence"], 82), current_user["id"]),
        )
        room = conn.execute("SELECT * FROM rooms WHERE id = ?", (payload.room_id,)).fetchone()
    await sio.emit("room_participant_joined", {"room_id": payload.room_id, "user_id": current_user["id"], "name": current_user["name"]}, room=payload.room_id)
    return build_room_response(room, current_user["id"], include_token=True)


@fastapi_app.post("/rooms/leave")
async def rooms_leave(payload: RoomLeaveRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        conn.execute(
            "UPDATE room_participants SET left_at = ?, speaking = 0 WHERE room_id = ? AND user_id = ?",
            (utcnow(), payload.room_id, current_user["id"]),
        )
        analytics = ensure_room_analytics(conn, current_user["id"])
        conn.execute(
            "UPDATE room_analytics SET speaking_time = ?, speaking_streak = ? WHERE user_id = ?",
            (analytics["speaking_time"] + payload.duration, max(analytics["speaking_streak"], 1), current_user["id"]),
        )
    await sio.emit("room_participant_left", {"room_id": payload.room_id, "user_id": current_user["id"]}, room=payload.room_id)
    return {"status": "left"}


@fastapi_app.post("/rooms/end")
async def rooms_end(payload: RoomJoinRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        room = conn.execute("SELECT * FROM rooms WHERE id = ? AND host_id = ?", (payload.room_id, current_user["id"])).fetchone()
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found or not hosted by you")
        conn.execute("UPDATE rooms SET status = 'ended', ended_at = ? WHERE id = ?", (utcnow(), payload.room_id))
    await sio.emit("room_ended", {"room_id": payload.room_id}, room=payload.room_id)
    return {"status": "ended"}


@fastapi_app.post("/rooms/raise-hand")
async def rooms_raise_hand(payload: RoomJoinRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        conn.execute("UPDATE room_participants SET raised_hand = 1 WHERE room_id = ? AND user_id = ?", (payload.room_id, current_user["id"]))
    await sio.emit("room_hand_raised", {"room_id": payload.room_id, "user_id": current_user["id"], "name": current_user["name"]}, room=payload.room_id)
    return {"status": "raised"}


@fastapi_app.post("/rooms/approve-speaker")
async def rooms_approve_speaker(payload: RoomUserActionRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    if not payload.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing user_id")
    with get_conn() as conn:
        room = conn.execute("SELECT * FROM rooms WHERE id = ? AND host_id = ?", (payload.room_id, current_user["id"])).fetchone()
        if not room:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the host can approve speakers")
        conn.execute("UPDATE room_participants SET role = 'speaker', raised_hand = 0 WHERE room_id = ? AND user_id = ?", (payload.room_id, payload.user_id))
    await sio.emit("room_role_changed", {"room_id": payload.room_id, "user_id": payload.user_id, "role": "speaker"}, room=payload.room_id)
    return {"status": "approved"}


@fastapi_app.post("/rooms/invite")
async def rooms_invite(payload: RoomUserActionRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    if not payload.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing user_id")
    invite_id = secrets.token_urlsafe(12)
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO room_invites (id, room_id, inviter_id, invitee_id, created_at) VALUES (?, ?, ?, ?, ?)",
            (invite_id, payload.room_id, current_user["id"], payload.user_id, utcnow()),
        )
    await emit_to_user(payload.user_id, "room_invite", {"room_id": payload.room_id, "invite_id": invite_id, "from": current_user["name"]})
    return {"status": "invited", "invite_id": invite_id}


@fastapi_app.post("/agora/token")
async def agora_token(payload: AgoraTokenRequest, current_user: sqlite3.Row = Depends(get_current_user)):
    uid = payload.uid or create_visitor_uid()
    return {"channel_name": payload.channel_name, "uid": uid, "agora_token": create_agora_token(payload.channel_name, uid)}


@fastapi_app.get("/rooms/analytics")
async def rooms_analytics(current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        row = ensure_room_analytics(conn, current_user["id"])
    return {
        "speakingTime": row["speaking_time"],
        "roomsJoined": row["rooms_joined"],
        "roomsHosted": row["rooms_hosted"],
        "averageConfidence": row["average_confidence"],
        "speakingStreak": row["speaking_streak"],
    }


@fastapi_app.get("/call/history")
async def call_history(current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT c.*, u.name AS partner_name, u.email AS partner_email
            FROM calls c
            JOIN users u ON u.id = CASE WHEN c.caller_id = ? THEN c.receiver_id ELSE c.caller_id END
            WHERE c.caller_id = ? OR c.receiver_id = ?
            ORDER BY c.created_at DESC LIMIT 50
            """,
            (current_user["id"], current_user["id"], current_user["id"]),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "caller_id": row["caller_id"],
            "receiver_id": row["receiver_id"],
            "duration": row["duration"],
            "timestamp": row["created_at"],
            "call_type": row["call_type"],
            "status": row["status"],
            "partner": {"id": row["receiver_id"] if row["caller_id"] == current_user["id"] else row["caller_id"], "name": row["partner_name"], "email": row["partner_email"]},
        }
        for row in rows
    ]


@fastapi_app.get("/progress")
async def progress(current_user: sqlite3.Row = Depends(get_current_user)):
    with get_conn() as conn:
        row = ensure_progress(conn, current_user["id"])
    return {
        "stars": row["stars"],
        "streak_count": row["streak_count"],
        "weekly_duration": row["weekly_duration"],
        "last_speaking_date": row["last_speaking_date"],
    }


@sio.event
async def connect(sid, environ, auth):
    token = (auth or {}).get("token")
    user = auth_user_from_token(token) if token else None
    if not user:
        raise ConnectionRefusedError("unauthorized")
    user_id = user["id"]
    online_users[user_id] = sid
    socket_users[sid] = user_id
    await sio.save_session(sid, {"user_id": user_id})
    await sio.emit("user_online", {"user_id": user_id, "online": True})


@sio.event
async def disconnect(sid):
    user_id = socket_users.pop(sid, None)
    if not user_id:
        return
    online_users.pop(user_id, None)
    if user_id in matchmaking_queue:
        matchmaking_queue.remove(user_id)
    await sio.emit("user_left", {"user_id": user_id})


@sio.event
async def call_accepted(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    call_id = data.get("call_id")
    with get_conn() as conn:
        call = conn.execute("SELECT * FROM calls WHERE id = ? AND receiver_id = ?", (call_id, user_id)).fetchone()
        if not call:
            return
        conn.execute("UPDATE calls SET status = 'active', started_at = ? WHERE id = ?", (utcnow(), call_id))
        call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
    await emit_call_to_participants(call, "call_accepted")


@sio.event
async def call_rejected(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    call_id = data.get("call_id")
    with get_conn() as conn:
        call = conn.execute("SELECT * FROM calls WHERE id = ? AND receiver_id = ?", (call_id, user_id)).fetchone()
        if not call:
            return
        conn.execute("UPDATE calls SET status = 'rejected', ended_at = ?, ended_by = ? WHERE id = ?", (utcnow(), user_id, call_id))
        call = conn.execute("SELECT * FROM calls WHERE id = ?", (call_id,)).fetchone()
    await emit_call_to_participants(call, "call_rejected")


@sio.event
async def room_joined(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    if room_id:
        await sio.enter_room(sid, room_id)
        await sio.emit("room_presence", {"room_id": room_id, "user_id": user_id, "online": True}, room=room_id)


@sio.event
async def room_left(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    if room_id:
        await sio.leave_room(sid, room_id)
        await sio.emit("room_presence", {"room_id": room_id, "user_id": user_id, "online": False}, room=room_id)


@sio.event
async def room_mute_changed(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    muted = bool(data.get("muted"))
    if not room_id:
        return
    with get_conn() as conn:
        conn.execute("UPDATE room_participants SET muted = ? WHERE room_id = ? AND user_id = ?", (int(muted), room_id, user_id))
    await sio.emit("room_mute_changed", {"room_id": room_id, "user_id": user_id, "muted": muted}, room=room_id)


@sio.event
async def room_speaking_changed(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    speaking = bool(data.get("speaking"))
    if not room_id:
        return
    with get_conn() as conn:
        conn.execute("UPDATE room_participants SET speaking = ? WHERE room_id = ? AND user_id = ?", (int(speaking), room_id, user_id))
    await sio.emit("room_speaking_changed", {"room_id": room_id, "user_id": user_id, "speaking": speaking}, room=room_id)


@sio.event
async def room_reaction(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    emoji = data.get("emoji", "👏")
    if not room_id:
        return
    reaction_id = secrets.token_urlsafe(10)
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO room_reactions (id, room_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?, ?)",
            (reaction_id, room_id, user_id, emoji, utcnow()),
        )
    await sio.emit("room_reaction", {"id": reaction_id, "room_id": room_id, "user_id": user_id, "emoji": emoji}, room=room_id)


@sio.event
async def room_message(sid, data):
    session = await sio.get_session(sid)
    user_id = session["user_id"]
    room_id = data.get("room_id")
    text = str(data.get("text", "")).strip()
    if not room_id or not text:
        return
    message_id = secrets.token_urlsafe(10)
    with get_conn() as conn:
        user = conn.execute("SELECT name FROM users WHERE id = ?", (user_id,)).fetchone()
        conn.execute(
            "INSERT INTO room_messages (id, room_id, user_id, text, kind, created_at) VALUES (?, ?, ?, ?, 'message', ?)",
            (message_id, room_id, user_id, text[:600], utcnow()),
        )
    await sio.emit(
        "room_message",
        {"id": message_id, "room_id": room_id, "user_id": user_id, "user_name": user["name"] if user else "Speaker", "text": text[:600], "kind": "message", "created_at": utcnow()},
        room=room_id,
    )
