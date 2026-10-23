import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings

_MAX_BCRYPT_BYTES = 72


def _norm(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_BCRYPT_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_norm(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_norm(password), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expire, "iat": datetime.now(timezone.utc)}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
    sub = payload.get("sub")
    return str(sub) if sub else None


# Password reset tokens are signed JWTs that also carry a fingerprint of the
# current password hash, so a link stops working as soon as it has been used
# (or the password changes any other way). No database table needed.
_RESET_PURPOSE = "pwreset"


def _password_fingerprint(hashed: str) -> str:
    return hashlib.sha256(hashed.encode("utf-8")).hexdigest()[:24]


def create_reset_token(user_id: int, hashed_password: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "purpose": _RESET_PURPOSE,
        "pwh": _password_fingerprint(hashed_password),
        "iat": now,
        "exp": now + timedelta(minutes=settings.password_reset_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def read_reset_token(token: str) -> tuple[int, str] | None:
    """Return (user_id, password fingerprint) for a valid reset token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        return None
    sub = str(payload.get("sub") or "")
    if payload.get("purpose") != _RESET_PURPOSE or not sub.isdigit():
        return None
    return int(sub), str(payload.get("pwh") or "")


def reset_token_matches(fingerprint: str, hashed_password: str) -> bool:
    return bool(fingerprint) and fingerprint == _password_fingerprint(hashed_password)
