import os
import secrets
import time
from pathlib import Path

from dotenv import load_dotenv
try:
    from agora_token_builder import RtcTokenBuilder
except ImportError:  # Allows local auth/matchmaking without tokens until requirements are installed.
    RtcTokenBuilder = None

load_dotenv(Path(__file__).with_name(".env"))

AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")
AGORA_TOKEN_TTL_SECONDS = int(os.getenv("AGORA_TOKEN_TTL_SECONDS", "3600"))


def create_channel_name() -> str:
    return f"english_room_{secrets.randbelow(9000) + 1000}"


def create_visitor_uid() -> int:
    return secrets.randbelow(2_000_000_000) + 1


def create_agora_token(channel_name: str, uid: int) -> str | None:
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE or RtcTokenBuilder is None:
        return None

    expire_at = int(time.time()) + AGORA_TOKEN_TTL_SECONDS
    privilege_expired_ts = expire_at
    return RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        channel_name,
        uid,
        1,
        privilege_expired_ts,
    )
