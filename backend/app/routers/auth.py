from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

from fastapi import Depends

from app.deps import CurrentUser, DbSession
from app.models import User
from app.schemas import LoginIn, Token, UserOut
from app.utils.security import create_access_token, verify_password

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
