"""One-off removal of the Crypto desk.

The site no longer covers cryptocurrency (it is a sensitive category for ad
review), so on startup every trace of it is taken out of the database: the
category, its articles, and crypto tags. Nothing is lost outright: the removed
rows are written to a JSON file under ``backups/`` and images only those
articles used are moved there too, outside the public /media folder.

It is idempotent: once nothing crypto is left it does nothing.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

from app.config import BASE_DIR, settings
from app.models import Category, Media, Post, Setting, Tag

REMOVED_CATEGORY = "crypto"
BACKUP_DIR = BASE_DIR / "backups"

# Tag slugs are hyphenated, so match whole words inside the slug.
CRYPTO_WORDS = re.compile(
    r"(^|-)(crypto\w*|bitcoin|btc|ethereum|eth|blockchain|defi|nft|nfts|altcoins?|"
    r"dogecoin|stablecoins?|coinbase|binance|web3|solana|xrp|litecoin|memecoins?)(-|$)"
)


def _is_crypto_tag(tag: Tag) -> bool:
    return bool(CRYPTO_WORDS.search(tag.slug))


def _post_urls(post: Post) -> set[str]:
    urls = {post.cover_image, post.og_image, *(img.url for img in post.images)}
    return {u for u in urls if u}


def _post_row(post: Post) -> dict:
    return {
        "id": post.id,
        "title": post.title,
        "slug": post.slug,
        "status": post.status.value,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "excerpt": post.excerpt,
        "content": post.content,
        "cover_image": post.cover_image,
        "cover_alt": post.cover_alt,
        "meta_title": post.meta_title,
        "meta_description": post.meta_description,
        "author_id": post.author_id,
        "tags": [t.name for t in post.tags],
        "images": [img.url for img in post.images],
    }


def _move_media(url: str, dest: Path) -> None:
    """Move /media/... files (and the matching thumbnail) out of public view."""
    if not url.startswith("/media/"):
        return
    rel = url[len("/media/"):]
    for candidate in {rel, rel.replace(".webp", "-thumb.webp")}:
        src = settings.media_path / candidate
        if src.is_file():
            target = dest / candidate
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(target))


def remove_crypto(db: Session) -> dict[str, int]:
    category = db.query(Category).filter(Category.slug == REMOVED_CATEGORY).one_or_none()
    posts = (
        db.query(Post)
        .options(joinedload(Post.tags), joinedload(Post.images))
        .filter(Post.category_id == category.id)
        .all()
        if category
        else []
    )
    crypto_tags = [t for t in db.query(Tag).all() if _is_crypto_tag(t)]
    # Tags that would be left with no articles once the crypto ones are gone.
    removed_ids = {p.id for p in posts}
    orphan_tags = {
        t.id: t
        for p in posts
        for t in p.tags
        if all(other.id in removed_ids for other in t.posts)
    }
    tags = {**orphan_tags, **{t.id: t for t in crypto_tags}}

    tagline = db.get(Setting, "site_tagline")
    stale_tagline = bool(tagline and "crypto" in tagline.value.lower())

    if not (category or posts or tags or stale_tagline):
        return {}

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    dest = BACKUP_DIR / f"removed-crypto-{stamp}"
    dest.mkdir(parents=True, exist_ok=True)

    # Images still used by an article that stays are left where they are.
    removed_urls = set().union(*(_post_urls(p) for p in posts)) if posts else set()
    if removed_urls:
        for other in db.query(Post).filter(Post.id.notin_(removed_ids)).all():
            removed_urls -= {u for u in removed_urls if u in _post_urls(other) or u in other.content}
    media = db.query(Media).filter(Media.url.in_(removed_urls)).all() if removed_urls else []

    (dest / "removed.json").write_text(
        json.dumps(
            {
                "category": {"name": category.name, "slug": category.slug} if category else None,
                "posts": [_post_row(p) for p in posts],
                "tags": [{"name": t.name, "slug": t.slug} for t in tags.values()],
                "media": [m.url for m in media],
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    for url in removed_urls:
        _move_media(url, dest / "media")

    for post in posts:
        db.delete(post)
    for tag in tags.values():
        db.delete(tag)
    for item in media:
        db.delete(item)
    if category:
        db.delete(category)
    if stale_tagline:
        tagline.value = settings.site_tagline
    db.commit()

    return {"posts": len(posts), "tags": len(tags), "media": len(media)}
