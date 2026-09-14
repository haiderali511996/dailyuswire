"""Read-only endpoints the Next.js front end consumes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.deps import DbSession
from app.models import Category, Post, PostStatus, Subscriber, Tag, User
from app.schemas import (
    AuthorPublic,
    CategoryWithCount,
    Paginated,
    PostCard,
    PostOut,
    SubscribeIn,
    TagOut,
)
from app.services.posts import publish_due_posts
from app.utils.seo import breadcrumbs, news_article
from app.utils.text import strip_tags

router = APIRouter(prefix="/api", tags=["public"])

CACHE = "public, s-maxage=60, stale-while-revalidate=300"


def _published(db: Session):
    return (
        db.query(Post)
        .options(joinedload(Post.category), joinedload(Post.author))
        .filter(Post.status == PostStatus.published, Post.published_at <= datetime.now(timezone.utc))
    )


def _paginate(query, page: int, per_page: int) -> Paginated:
    total = query.order_by(None).count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    return Paginated(
        items=[PostCard.model_validate(p) for p in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
    )


@router.get("/categories", response_model=list[CategoryWithCount])
def list_categories(db: DbSession, response: Response) -> list[CategoryWithCount]:
    response.headers["Cache-Control"] = CACHE
    rows = (
        db.query(Category, func.count(Post.id))
        .outerjoin(
            Post,
            (Post.category_id == Category.id) & (Post.status == PostStatus.published),
        )
        .filter(Category.is_active.is_(True))
        .group_by(Category.id)
        .order_by(Category.position, Category.name)
        .all()
    )
    return [
        CategoryWithCount(**CategoryWithCount.model_validate(cat).model_dump(exclude={"post_count"}), post_count=count)
        for cat, count in rows
    ]


@router.get("/posts", response_model=Paginated)
def list_posts(
    db: DbSession,
    response: Response,
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=50),
    category: str | None = None,
    tag: str | None = None,
    author: str | None = None,
    featured: bool | None = None,
    breaking: bool | None = None,
    q: str | None = None,
    exclude: int | None = None,
) -> Paginated:
    publish_due_posts(db)
    response.headers["Cache-Control"] = CACHE
    query = _published(db)
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if tag:
        query = query.join(Post.tags).filter(Tag.slug == tag)
    if author:
        query = query.join(User, Post.author_id == User.id).filter(User.slug == author)
    if featured is not None:
        query = query.filter(Post.is_featured.is_(featured))
    if breaking is not None:
        query = query.filter(Post.is_breaking.is_(breaking))
    if q:
        needle = f"%{q.strip()}%"
        query = query.filter(
            or_(Post.title.ilike(needle), Post.excerpt.ilike(needle), Post.content.ilike(needle))
        )
    if exclude:
        query = query.filter(Post.id != exclude)
    return _paginate(query.order_by(Post.published_at.desc()), page, per_page)


@router.get("/posts/trending", response_model=list[PostCard])
def trending(db: DbSession, response: Response, limit: int = Query(6, ge=1, le=20)) -> list[Post]:
    response.headers["Cache-Control"] = CACHE
    return (
        _published(db)
        .order_by(Post.views.desc(), Post.published_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/posts/{slug}", response_model=PostOut)
def get_post(db: DbSession, slug: str, response: Response) -> Post:
    post = (
        _published(db)
        .options(joinedload(Post.tags), joinedload(Post.images))
        .filter(Post.slug == slug)
        .one_or_none()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Article not found")
    response.headers["Cache-Control"] = CACHE
    return post


@router.post("/posts/{slug}/view", status_code=204)
def register_view(db: DbSession, slug: str) -> Response:
    db.query(Post).filter(Post.slug == slug).update(
        {Post.views: Post.views + 1}, synchronize_session=False
    )
    db.commit()
    return Response(status_code=204)


@router.get("/posts/{slug}/related", response_model=list[PostCard])
def related(db: DbSession, slug: str, limit: int = Query(4, ge=1, le=12)) -> list[Post]:
    post = db.query(Post).filter(Post.slug == slug).one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Article not found")
    return (
        _published(db)
        .filter(Post.id != post.id, Post.category_id == post.category_id)
        .order_by(Post.published_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/posts/{slug}/schema")
def post_schema(db: DbSession, slug: str) -> dict:
    """JSON-LD for the article page: NewsArticle + BreadcrumbList."""
    post = (
        _published(db)
        .options(joinedload(Post.tags), joinedload(Post.images))
        .filter(Post.slug == slug)
        .one_or_none()
    )
    if not post:
        raise HTTPException(status_code=404, detail="Article not found")
    data = PostOut.model_validate(post).model_dump(mode="json")
    data["word_count"] = len(strip_tags(post.content).split())
    crumbs = [("Home", "/")]
    if post.category:
        crumbs.append((post.category.name, f"/{post.category.slug}"))
    crumbs.append((post.title, f"/{post.category.slug}/{post.slug}" if post.category else f"/{post.slug}"))
    return {"article": news_article(data), "breadcrumbs": breadcrumbs(crumbs)}


@router.get("/authors/{slug}", response_model=AuthorPublic)
def get_author(db: DbSession, slug: str) -> User:
    user = db.query(User).filter(User.slug == slug, User.is_active.is_(True)).one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Author not found")
    return user


@router.get("/tags", response_model=list[TagOut])
def list_tags(db: DbSession, limit: int = Query(40, ge=1, le=200)) -> list[Tag]:
    return (
        db.query(Tag)
        .join(Tag.posts)
        .filter(Post.status == PostStatus.published)
        .group_by(Tag.id)
        .order_by(func.count(Post.id).desc())
        .limit(limit)
        .all()
    )


@router.get("/sitemap-data")
def sitemap_data(db: DbSession) -> dict:
    """Everything Next.js needs to build sitemap.xml and news-sitemap.xml."""
    posts = (
        _published(db)
        .filter(Post.no_index.is_(False))
        .options(joinedload(Post.category))
        .order_by(Post.published_at.desc())
        .limit(5000)
        .all()
    )
    return {
        "site_url": settings.site_url.rstrip("/"),
        "site_name": settings.site_name,
        "categories": [
            {"slug": c.slug, "name": c.name}
            for c in db.query(Category).filter(Category.is_active.is_(True)).all()
        ],
        "authors": [
            {"slug": u.slug} for u in db.query(User).filter(User.is_active.is_(True)).all()
        ],
        "posts": [
            {
                "slug": p.slug,
                "title": p.title,
                "category": p.category.slug if p.category else "news",
                "published_at": p.published_at.isoformat() if p.published_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "cover_image": p.cover_image,
            }
            for p in posts
        ],
    }


@router.post("/subscribe", status_code=201)
def subscribe(db: DbSession, payload: SubscribeIn) -> dict:
    email = payload.email.lower().strip()
    existing = db.query(Subscriber).filter(Subscriber.email == email).one_or_none()
    if existing:
        existing.is_active = True
        db.commit()
        return {"detail": "You are already subscribed."}
    db.add(Subscriber(email=email))
    db.commit()
    return {"detail": "Thanks - check your inbox to confirm."}
