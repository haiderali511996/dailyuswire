"""Admin: categories, users, media library, settings, dashboard."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import func

from app.deps import AdminUser, CurrentUser, DbSession, EditorUser
from app.models import (
    Category,
    Media,
    Post,
    PostStatus,
    Role,
    Setting,
    Subscriber,
    User,
)
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    DashboardStats,
    MediaOut,
    PostCard,
    SettingIn,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.utils.images import UploadError, save_image
from app.utils.security import hash_password
from app.utils.text import slugify, unique_slug

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------------- Dashboard ----------------
@router.get("/stats", response_model=DashboardStats)
def stats(db: DbSession, user: CurrentUser) -> DashboardStats:
    counts = dict(
        db.query(Post.status, func.count(Post.id)).group_by(Post.status).all()
    )
    per_category = [
        {"name": name, "slug": slug, "count": count}
        for name, slug, count in db.query(Category.name, Category.slug, func.count(Post.id))
        .outerjoin(Post, Post.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.position)
        .all()
    ]
    recent = (
        db.query(Post).order_by(Post.updated_at.desc()).limit(8).all()
    )
    return DashboardStats(
        total_posts=db.query(func.count(Post.id)).scalar() or 0,
        published=counts.get(PostStatus.published, 0),
        drafts=counts.get(PostStatus.draft, 0),
        scheduled=counts.get(PostStatus.scheduled, 0),
        total_views=db.query(func.coalesce(func.sum(Post.views), 0)).scalar() or 0,
        subscribers=db.query(func.count(Subscriber.id)).scalar() or 0,
        per_category=per_category,
        recent=[PostCard.model_validate(p) for p in recent],
    )


# ---------------- Categories ----------------
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: DbSession, user: CurrentUser) -> list[Category]:
    return db.query(Category).order_by(Category.position, Category.name).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(db: DbSession, user: EditorUser, payload: CategoryCreate) -> Category:
    if db.query(Category).filter(Category.name == payload.name).one_or_none():
        raise HTTPException(status_code=409, detail="A category with that name already exists")
    data = payload.model_dump(exclude={"slug"})
    category = Category(**data, slug=unique_slug(db, Category, payload.slug or payload.name))
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    db: DbSession, user: EditorUser, category_id: int, payload: CategoryUpdate
) -> Category:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump(exclude_unset=True, exclude={"slug"})
    for key, value in data.items():
        setattr(category, key, value)
    if payload.slug and slugify(payload.slug) != category.slug:
        category.slug = unique_slug(db, Category, payload.slug, exclude_id=category.id)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(db: DbSession, user: AdminUser, category_id: int) -> None:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    in_use = db.query(func.count(Post.id)).filter(Post.category_id == category_id).scalar()
    if in_use:
        raise HTTPException(
            status_code=409,
            detail=f"{in_use} post(s) still use this category. Move them first.",
        )
    db.delete(category)
    db.commit()


# ---------------- Users ----------------
@router.get("/users", response_model=list[UserOut])
def list_users(db: DbSession, user: EditorUser) -> list[User]:
    return db.query(User).order_by(User.name).all()


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(db: DbSession, admin: AdminUser, payload: UserCreate) -> User:
    email = payload.email.lower().strip()
    if db.query(User).filter(User.email == email).one_or_none():
        raise HTTPException(status_code=409, detail="That email is already registered")
    data = payload.model_dump(exclude={"password", "email"})
    new_user = User(
        **data,
        email=email,
        slug=unique_slug(db, User, payload.name),
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(db: DbSession, current: CurrentUser, user_id: int, payload: UserUpdate) -> User:
    if current.role != Role.admin and current.id != user_id:
        raise HTTPException(status_code=403, detail="You can only edit your own profile")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True, exclude={"password"})
    if current.role != Role.admin:
        data.pop("role", None)
        data.pop("is_active", None)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower().strip()
    for key, value in data.items():
        setattr(target, key, value)
    if payload.password:
        target.hashed_password = hash_password(payload.password)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}", status_code=204)
def delete_user(db: DbSession, admin: AdminUser, user_id: int) -> None:
    if admin.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = False  # keep byline history intact
    db.commit()


# ---------------- Media library ----------------
@router.get("/media", response_model=list[MediaOut])
def list_media(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(40, ge=1, le=100),
) -> list[Media]:
    return (
        db.query(Media)
        .order_by(Media.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )


@router.post("/media", response_model=MediaOut, status_code=201)
async def upload_media(
    db: DbSession,
    user: CurrentUser,
    file: Annotated[UploadFile, File()],
    alt: Annotated[str, Form()] = "",
) -> Media:
    raw = await file.read()
    try:
        info = save_image(raw, file.filename or "upload", file.content_type or "")
    except UploadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    media = Media(**info, alt=alt, uploaded_by=user.id)
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@router.post("/media/tinymce", status_code=201)
async def upload_for_editor(
    db: DbSession, user: CurrentUser, file: Annotated[UploadFile, File()]
) -> dict:
    """TinyMCE's images_upload_handler expects a bare {"location": url}."""
    media = await upload_media(db, user, file, alt="")
    return {"location": media.url}


@router.delete("/media/{media_id}", status_code=204)
def delete_media(db: DbSession, user: EditorUser, media_id: int) -> None:
    media = db.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    db.delete(media)
    db.commit()


# ---------------- Settings ----------------
@router.get("/settings")
def get_settings_map(db: DbSession, user: CurrentUser) -> dict[str, str]:
    return {s.key: s.value for s in db.query(Setting).all()}


@router.put("/settings")
def put_settings(db: DbSession, user: AdminUser, payload: list[SettingIn]) -> dict[str, str]:
    for item in payload:
        setting = db.get(Setting, item.key)
        if setting:
            setting.value = item.value
        else:
            db.add(Setting(key=item.key, value=item.value))
    db.commit()
    return {s.key: s.value for s in db.query(Setting).all()}
