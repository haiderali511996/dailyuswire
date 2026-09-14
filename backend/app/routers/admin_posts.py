from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.deps import CurrentUser, DbSession, can_edit_post
from app.models import Post, PostStatus, Role
from app.schemas import (
    AdminPaginated,
    PostCreate,
    PostOut,
    PostUpdate,
    SeoAnalysisIn,
)
from app.services.posts import (
    apply_content,
    apply_seo_defaults,
    apply_status,
    ensure_slug,
    resolve_tags,
    revalidate_frontend,
    sync_images,
)
from app.utils.text import seo_score

router = APIRouter(prefix="/api/admin/posts", tags=["admin:posts"])


def _load(db, post_id: int) -> Post:
    post = (
        db.query(Post)
        .options(joinedload(Post.tags), joinedload(Post.images), joinedload(Post.category))
        .filter(Post.id == post_id)
        .one_or_none()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def _paths_for(post: Post) -> list[str]:
    cat = post.category.slug if post.category else "news"
    return ["/", f"/{cat}", f"/{cat}/{post.slug}", "/sitemap.xml"]


@router.get("", response_model=AdminPaginated)
def list_posts(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: PostStatus | None = None,
    category_id: int | None = None,
    q: str | None = None,
) -> AdminPaginated:
    query = db.query(Post).options(
        joinedload(Post.category), joinedload(Post.author), joinedload(Post.tags), joinedload(Post.images)
    )
    if user.role == Role.author:
        query = query.filter(Post.author_id == user.id)
    if status:
        query = query.filter(Post.status == status)
    if category_id:
        query = query.filter(Post.category_id == category_id)
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(or_(Post.title.ilike(needle), Post.slug.ilike(needle)))

    total = query.order_by(None).distinct().count()
    items = (
        query.order_by(Post.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return AdminPaginated(
        items=[PostOut.model_validate(p) for p in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
    )


@router.get("/{post_id}", response_model=PostOut)
def get_post(db: DbSession, user: CurrentUser, post_id: int) -> Post:
    post = _load(db, post_id)
    if not can_edit_post(user, post):
        raise HTTPException(status_code=403, detail="Not your post")
    return post


@router.post("", response_model=PostOut, status_code=201)
async def create_post(db: DbSession, user: CurrentUser, payload: PostCreate) -> Post:
    data = payload.model_dump(exclude={"tags", "images", "slug", "content", "status", "published_at"})
    if user.role == Role.author:
        data["author_id"] = user.id
    else:
        data["author_id"] = payload.author_id or user.id

    post = Post(**data)
    apply_content(post, payload.content)
    ensure_slug(db, post, payload.slug or payload.title)
    apply_status(post, payload.status, payload.published_at)
    apply_seo_defaults(post)
    post.tags = resolve_tags(db, payload.tags)
    db.add(post)
    db.flush()
    sync_images(db, post, payload.images)
    db.commit()
    db.refresh(post)
    if post.status == PostStatus.published:
        await revalidate_frontend(_paths_for(post))
    return _load(db, post.id)


@router.patch("/{post_id}", response_model=PostOut)
async def update_post(db: DbSession, user: CurrentUser, post_id: int, payload: PostUpdate) -> Post:
    post = _load(db, post_id)
    if not can_edit_post(user, post):
        raise HTTPException(status_code=403, detail="Not your post")
    old_paths = _paths_for(post)

    data = payload.model_dump(
        exclude_unset=True, exclude={"tags", "images", "slug", "content", "status", "published_at"}
    )
    if user.role == Role.author:
        data.pop("author_id", None)
    for key, value in data.items():
        setattr(post, key, value)

    if payload.content is not None:
        apply_content(post, payload.content)
    if payload.slug is not None:
        ensure_slug(db, post, payload.slug)
    if payload.tags is not None:
        post.tags = resolve_tags(db, payload.tags)
    if payload.images is not None:
        sync_images(db, post, payload.images)
    apply_status(post, payload.status, payload.published_at)
    apply_seo_defaults(post)

    db.commit()
    db.refresh(post)
    await revalidate_frontend(sorted(set(old_paths + _paths_for(post))))
    return _load(db, post.id)


@router.delete("/{post_id}", status_code=204)
async def delete_post(db: DbSession, user: CurrentUser, post_id: int) -> None:
    post = _load(db, post_id)
    if not can_edit_post(user, post):
        raise HTTPException(status_code=403, detail="Not your post")
    paths = _paths_for(post)
    db.delete(post)
    db.commit()
    await revalidate_frontend(paths)


@router.post("/seo-analysis")
def analyse(payload: SeoAnalysisIn, user: CurrentUser) -> dict:
    """Live Yoast-style feedback for the editor sidebar."""
    return seo_score(**payload.model_dump())
