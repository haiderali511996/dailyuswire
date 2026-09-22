"""Shared write-path logic for posts so the admin router stays thin."""

from __future__ import annotations

from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Post, PostImage, PostStatus, Tag
from app.utils.seo import post_url
from app.utils.text import (
    add_heading_ids,
    make_excerpt,
    reading_time,
    sanitize_html,
    slugify,
    unique_slug,
)

MAX_POST_IMAGES = 5


def resolve_tags(db: Session, names: list[str]) -> list[Tag]:
    tags: list[Tag] = []
    seen: set[str] = set()
    for raw in names:
        name = raw.strip()
        if not name:
            continue
        slug = slugify(name, max_length=100)
        if slug in seen:
            continue
        seen.add(slug)
        tag = db.query(Tag).filter(Tag.slug == slug).one_or_none()
        if not tag:
            tag = Tag(name=name, slug=slug)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags


def sync_images(db: Session, post: Post, images: list) -> None:
    post.images.clear()
    db.flush()
    for i, img in enumerate(images[:MAX_POST_IMAGES]):
        data = img if isinstance(img, dict) else img.model_dump()
        if not data.get("url"):
            continue
        post.images.append(
            PostImage(
                url=data["url"],
                alt=data.get("alt", ""),
                caption=data.get("caption", ""),
                credit=data.get("credit", ""),
                position=data.get("position") or i,
            )
        )


def apply_content(post: Post, raw_html: str) -> None:
    clean = add_heading_ids(sanitize_html(raw_html))
    post.content = clean
    post.reading_time = reading_time(clean)


def apply_seo_defaults(post: Post) -> None:
    """Never ship an article without a title tag and description."""
    if not post.excerpt:
        post.excerpt = make_excerpt(post.content)
    if not post.meta_title:
        post.meta_title = post.title[:60]
    if not post.meta_description:
        post.meta_description = (post.excerpt or make_excerpt(post.content))[:160]
    if not post.og_image:
        post.og_image = post.cover_image
    # A canonical that just points at the article itself is stored blank: the
    # front end derives the self-canonical from category + slug on every
    # render, so a later slug or section change can never leave it stale.
    if post.canonical_url and post.canonical_url == post_url(post):
        post.canonical_url = ""


def apply_status(post: Post, status: PostStatus | None, published_at: datetime | None) -> None:
    now = datetime.now(timezone.utc)
    if status is not None:
        post.status = status
    if published_at is not None:
        post.published_at = published_at
    if post.status == PostStatus.published and not post.published_at:
        post.published_at = now
    if post.status == PostStatus.scheduled and (not post.published_at or post.published_at <= now):
        # A schedule in the past is just a publish.
        post.status = PostStatus.published
        post.published_at = post.published_at or now


def ensure_slug(db: Session, post: Post, requested: str | None) -> None:
    source = requested or post.slug or post.title
    if not post.slug or (requested and slugify(requested) != post.slug):
        post.slug = unique_slug(db, Post, source, exclude_id=post.id)


def publish_due_posts(db: Session) -> int:
    """Flip scheduled posts whose time has come. Called on read of public lists."""
    now = datetime.now(timezone.utc)
    due = (
        db.query(Post)
        .filter(Post.status == PostStatus.scheduled, Post.published_at <= now)
        .all()
    )
    for post in due:
        post.status = PostStatus.published
    if due:
        db.commit()
    return len(due)


async def revalidate_frontend(paths: list[str], tags: list[str] | None = None) -> None:
    """Ping Next.js so ISR pages refresh the moment an editor publishes.

    ``tags`` narrows which cached fetches are expired; when omitted the
    frontend falls back to expiring all post content.
    """
    if not settings.revalidate_url or not settings.revalidate_secret:
        return
    body: dict = {"secret": settings.revalidate_secret, "paths": paths}
    if tags is not None:
        body["tags"] = tags
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(settings.revalidate_url, json=body)
    except Exception:  # noqa: BLE001 - revalidation must never break a save
        pass
