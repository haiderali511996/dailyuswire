"""RSS 2.0 feeds for the public site - one global, one per category."""

from __future__ import annotations

from datetime import datetime, timezone
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Response
from sqlalchemy.orm import joinedload

from app.config import settings
from app.deps import DbSession
from app.models import Category, Post, PostStatus
from app.utils.seo import post_url

router = APIRouter(tags=["feeds"])


def _rfc822(value: datetime | None) -> str:
    value = value or datetime.now(timezone.utc)
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.strftime("%a, %d %b %Y %H:%M:%S %z")


def _render(title: str, description: str, link: str, posts: list[Post]) -> Response:
    site = settings.site_url.rstrip("/")
    items = []
    for post in posts:
        url = post_url(post)
        items.append(
            "<item>"
            f"<title>{escape(post.title)}</title>"
            f"<link>{escape(url)}</link>"
            f"<guid isPermaLink=\"true\">{escape(url)}</guid>"
            f"<description>{escape(post.excerpt or '')}</description>"
            f"<pubDate>{_rfc822(post.published_at)}</pubDate>"
            + (f"<category>{escape(post.category.name)}</category>" if post.category else "")
            + (f"<author>{escape(post.author.name)}</author>" if post.author else "")
            + "</item>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">'
        "<channel>"
        f"<title>{escape(title)}</title>"
        f"<link>{escape(link)}</link>"
        f"<description>{escape(description)}</description>"
        "<language>en-US</language>"
        f"<lastBuildDate>{_rfc822(None)}</lastBuildDate>"
        f'<atom:link href="{escape(link)}" rel="self" type="application/rss+xml"/>'
        + "".join(items)
        + "</channel></rss>"
    )
    return Response(
        content=xml,
        media_type="application/rss+xml; charset=utf-8",
        headers={"Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"},
    )


def _latest(db, limit: int = 30, category: Category | None = None) -> list[Post]:
    query = (
        db.query(Post)
        .options(joinedload(Post.category), joinedload(Post.author))
        .filter(Post.status == PostStatus.published, Post.published_at <= datetime.now(timezone.utc))
    )
    if category:
        query = query.filter(Post.category_id == category.id)
    return query.order_by(Post.published_at.desc()).limit(limit).all()


@router.get("/rss.xml")
def rss(db: DbSession) -> Response:
    return _render(
        settings.site_name,
        settings.site_tagline,
        f"{settings.site_url.rstrip('/')}/rss",
        _latest(db),
    )


@router.get("/rss/{category_slug}.xml")
def rss_category(db: DbSession, category_slug: str) -> Response:
    category = db.query(Category).filter(Category.slug == category_slug).one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return _render(
        f"{settings.site_name} - {category.name}",
        category.description or f"{category.name} coverage from {settings.site_name}.",
        f"{settings.site_url.rstrip('/')}/rss/{category_slug}",
        _latest(db, category=category),
    )
