from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Role, User
from app.utils.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession, token: Annotated[str | None, Depends(oauth2_scheme)]
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    subject = decode_access_token(token)
    if not subject:
        raise credentials_error
    user = db.get(User, int(subject)) if subject.isdigit() else None
    if not user or not user.is_active:
        raise credentials_error
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: Role):
    def checker(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return checker


require_admin = require_roles(Role.admin)
require_editor = require_roles(Role.admin, Role.editor)
AdminUser = Annotated[User, Depends(require_admin)]
EditorUser = Annotated[User, Depends(require_editor)]


def can_edit_post(user: User, post) -> bool:
    if user.role in (Role.admin, Role.editor):
        return True
    return post.author_id == user.id
