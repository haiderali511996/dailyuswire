import html
import logging
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.config import settings
from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas import ForgotPasswordIn, LoginIn, ResetPasswordIn, Token, UserOut
from app.utils.mailer import send_mail
from app.utils.security import (
    create_access_token,
    create_reset_token,
    hash_password,
    read_reset_token,
    reset_token_matches,
    verify_password,
)

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _authenticate(db, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email.lower().strip()).one_or_none()
    if not user or not verify_password(password, user.hashed_password) or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/login", response_model=Token)
def login(db: DbSession, payload: LoginIn) -> Token:
    user = _authenticate(db, payload.email, payload.password)
    return Token(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))


@router.post("/token", response_model=Token, include_in_schema=False)
def login_form(
    db: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """OAuth2 password flow so the interactive /docs page can authorise."""
    user = _authenticate(db, form.username, form.password)
    return Token(access_token=create_access_token(str(user.id)), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


# One reset email per address per minute, so the form can't be used to flood
# an inbox. Per process, which is enough for a small newsroom.
_RESET_COOLDOWN_SECONDS = 60
_last_reset_sent: dict[str, float] = {}

FORGOT_REPLY = {
    "detail": "If that email belongs to a newsroom account, a link to reset the password "
    "is on its way. Check your inbox and spam folder."
}


def _reset_email(user: User, link: str) -> tuple[str, str, str]:
    minutes = settings.password_reset_minutes
    subject = f"Reset your {settings.site_name} password"
    text = (
        f"Hi {user.name},\n\n"
        f"Someone asked to reset the password for your {settings.site_name} newsroom account "
        f"({user.email}).\n\n"
        f"Set a new password here (the link works once and expires in {minutes} minutes):\n"
        f"{link}\n\n"
        "If you did not ask for this, ignore this email - your password stays the same.\n"
    )
    safe_link = html.escape(link, quote=True)
    body = (
        f"<p>Hi {html.escape(user.name)},</p>"
        f"<p>Someone asked to reset the password for your {html.escape(settings.site_name)} "
        f"newsroom account ({html.escape(user.email)}).</p>"
        f'<p><a href="{safe_link}" style="display:inline-block;padding:10px 18px;'
        'background:#0b2545;color:#ffffff;text-decoration:none;border-radius:6px;'
        'font-weight:600">Set a new password</a></p>'
        f"<p>The link works once and expires in {minutes} minutes. If the button does not "
        f'work, paste this into your browser:<br><a href="{safe_link}">{safe_link}</a></p>'
        "<p>If you did not ask for this, ignore this email - your password stays the same.</p>"
    )
    return subject, text, body


@router.post("/forgot-password")
def forgot_password(db: DbSession, payload: ForgotPasswordIn) -> dict[str, str]:
    """Email a reset link. Always answers the same way so it can't reveal
    which addresses have accounts."""
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user or not user.is_active:
        return FORGOT_REPLY

    now = time.monotonic()
    if now - _last_reset_sent.get(email, -_RESET_COOLDOWN_SECONDS) < _RESET_COOLDOWN_SECONDS:
        return FORGOT_REPLY

    token = create_reset_token(user.id, user.hashed_password)
    link = f"{settings.site_url.rstrip('/')}/admin/reset-password?token={token}"
    subject, text, body = _reset_email(user, link)
    try:
        send_mail(user.email, subject, text, body)
        _last_reset_sent[email] = now
    except Exception:  # noqa: BLE001 - never let a mail failure show which emails exist
        log.exception("Could not send the password reset email to %s", email)
    return FORGOT_REPLY


@router.post("/reset-password")
def reset_password(db: DbSession, payload: ResetPasswordIn) -> dict[str, str]:
    invalid = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="This reset link is invalid or has expired. Request a new one.",
    )
    parsed = read_reset_token(payload.token)
    if not parsed:
        raise invalid
    user_id, fingerprint = parsed
    user = db.get(User, user_id)
    if not user or not user.is_active or not reset_token_matches(fingerprint, user.hashed_password):
        raise invalid

    user.hashed_password = hash_password(payload.password)
    db.commit()
    _last_reset_sent.pop(user.email, None)
    return {"detail": "Your password has been updated. You can sign in now."}
