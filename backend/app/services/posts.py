"""Shared write-path logic for posts so the admin router stays thin."""

from __future__ import annotations

import re
from datetime import datetime, timezone

import httpx
from sqlalchemy import or_
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
    strip_chatgpt_utm,
    unique_slug,
)

MAX_POST_IMAGES = 5
# Only the newest breaking stories stay in the header ticker; older ones are
# unflagged automatically so editors never have to clear them by hand.
MAX_BREAKING_POSTS = 15


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


def trim_breaking(db: Session, keep: int = MAX_BREAKING_POSTS) -> int:
    """Unflag every published breaking post beyond the newest ``keep``."""
    stale = (
        db.query(Post)
        .filter(Post.is_breaking.is_(True), Post.status == PostStatus.published)
        .order_by(Post.published_at.desc(), Post.id.desc())
        .offset(keep)
        .all()
    )
    for post in stale:
        post.is_breaking = False
    return len(stale)


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
        db.flush()
        trim_breaking(db)
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


def strip_chatgpt_links(db: Session) -> int:
    """Remove ?utm_source=chatgpt.com from links already saved in posts.

    Runs on startup; once no post carries the parameter it is a single cheap
    query that matches nothing.
    """
    fields = ("content", "excerpt", "source_url", "canonical_url")
    marker = "%utm_source=chatgpt.com%"
    posts = (
        db.query(Post)
        .filter(or_(*(getattr(Post, f).ilike(marker) for f in fields)))
        .all()
    )
    for post in posts:
        for f in fields:
            setattr(post, f, strip_chatgpt_utm(getattr(post, f) or ""))
    db.commit()
    return len(posts)


_ANCHOR_RE = re.compile(r"<a\b[^>]*>.*?</a>", re.IGNORECASE | re.DOTALL)


def unlink_domain(html: str, domain: str) -> str:
    """Unwrap every <a> pointing at `domain` (or a subdomain), keeping its text."""
    pattern = re.compile(
        r"<a\b[^>]*href=[\"']?(?:https?:)?//(?:[\w-]+\.)*" + re.escape(domain)
        + r"(?:[/?#:\"'\s][^>]*)?>(.*?)</a>",
        re.IGNORECASE | re.DOTALL,
    )
    return pattern.sub(r"\1", html)


def link_first_mention(html: str, phrase: str, href: str) -> tuple[str, bool]:
    """Link the first mention of `phrase` that is plain text, not already a link
    or inside a tag. Returns the new HTML and whether a link was added."""
    word = re.compile(r"(?<![\w-])" + re.escape(phrase) + r"(?![\w-])")
    out: list[str] = []
    pos = 0
    done = False
    for anchor in _ANCHOR_RE.finditer(html):
        out.append(html[pos:anchor.start()])
        out.append(anchor.group(0))
        pos = anchor.end()
    out.append(html[pos:])
    # Even indexes are text between anchors; odd ones are existing links.
    for i in range(0, len(out), 2):
        if done:
            break
        parts = re.split(r"(<[^>]+>)", out[i])
        for j in range(0, len(parts), 2):
            m = word.search(parts[j])
            if m:
                link = (
                    f'<a href="{href}" target="_blank" rel="noopener noreferrer">'
                    f"{m.group(0)}</a>"
                )
                parts[j] = parts[j][: m.start()] + link + parts[j][m.end():]
                done = True
                break
        out[i] = "".join(parts)
    return "".join(out), done


# Primary sources for the bodies the blood-pressure coverage cites by name.
# The first matching phrase per source is linked; acronyms come last so the
# full name wins when both appear.
BP_SOURCES: list[tuple[tuple[str, ...], str]] = [
    (("American Heart Association", "AHA"), "https://www.heart.org/en/health-topics/high-blood-pressure"),
    (("National Institutes of Health", "NHLBI", "NIH"), "https://www.nhlbi.nih.gov/health/high-blood-pressure"),
    (("National Institute for Health and Care Excellence", "NICE"), "https://www.nice.org.uk/guidance/ng136"),
    (("Centers for Disease Control and Prevention", "CDC"), "https://www.cdc.gov/high-blood-pressure/index.html"),
]


def fix_blood_pressure_sources(db: Session, spam_domain: str = "tips-and-tricks.co") -> int:
    """Drop the keyword-anchor link to `spam_domain` from every post, and link
    the health bodies the blood-pressure articles name to their own pages."""
    touched = 0
    spam = db.query(Post).filter(Post.content.ilike(f"%{spam_domain}%")).all()
    bp = (
        db.query(Post)
        .filter(or_(
            Post.title.ilike("%blood pressure%"),
            Post.title.ilike("%hypertension%"),
            Post.slug.ilike("%blood-pressure%"),
        ))
        .all()
    )
    for post in {p.id: p for p in [*spam, *bp]}.values():
        html = unlink_domain(post.content or "", spam_domain)
        for phrases, href in BP_SOURCES:
            if href in html:
                continue
            for phrase in phrases:
                html, added = link_first_mention(html, phrase, href)
                if added:
                    break
        if html != (post.content or ""):
            post.content = html
            touched += 1
    db.commit()
    return touched
