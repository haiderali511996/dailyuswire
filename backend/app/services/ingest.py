"""News ingestion from public RSS/Atom feeds.

Policy note (deliberate design):
  We store only what a publisher puts in their own syndication feed - headline,
  short summary, link and image - and we always keep the source link. Imported
  items become DRAFT posts marked "rewrite required". Nothing from a feed is
  ever auto-published, because republishing another outlet's article text is
  both a copyright problem and an AdSense "scraped content" policy violation.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from time import mktime

import feedparser
import httpx
from sqlalchemy.orm import Session

from app.models import Category, FeedItem, FeedSource, Post, PostStatus, User
from app.utils.text import make_excerpt, sanitize_html, strip_tags, unique_slug

USER_AGENT = "DailyUSWireBot/1.0 (+https://dailyuswire.com/about; newsroom aggregator)"

# Public syndication feeds, one or more per site category.
DEFAULT_SOURCES: list[dict] = [
    # --- News ---
    {"name": "NPR News", "url": "https://feeds.npr.org/1001/rss.xml", "homepage": "https://www.npr.org", "category_slug": "news"},
    {"name": "BBC News (US & Canada)", "url": "https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml", "homepage": "https://www.bbc.com/news", "category_slug": "news"},
    {"name": "ABC News Top Stories", "url": "https://feeds.abcnews.com/abcnews/topstories", "homepage": "https://abcnews.go.com", "category_slug": "news"},
    # --- Health ---
    {"name": "NPR Health", "url": "https://feeds.npr.org/1128/rss.xml", "homepage": "https://www.npr.org/sections/health-shots", "category_slug": "health"},
    {"name": "ScienceDaily Health & Medicine", "url": "https://www.sciencedaily.com/rss/health_medicine.xml", "homepage": "https://www.sciencedaily.com", "category_slug": "health"},
    {"name": "CDC Newsroom", "url": "https://tools.cdc.gov/api/v2/resources/media/404952.rss", "homepage": "https://www.cdc.gov/media", "category_slug": "health"},
    # --- Sports ---
    {"name": "ESPN Top Headlines", "url": "https://www.espn.com/espn/rss/news", "homepage": "https://www.espn.com", "category_slug": "sports"},
    {"name": "BBC Sport", "url": "https://feeds.bbci.co.uk/sport/rss.xml", "homepage": "https://www.bbc.com/sport", "category_slug": "sports"},
    # --- Entertainment ---
    {"name": "Variety", "url": "https://variety.com/feed/", "homepage": "https://variety.com", "category_slug": "entertainment"},
    {"name": "BBC Entertainment & Arts", "url": "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "homepage": "https://www.bbc.com/news/entertainment_and_arts", "category_slug": "entertainment"},
    # --- Crypto ---
    {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "homepage": "https://www.coindesk.com", "category_slug": "crypto"},
    {"name": "Cointelegraph", "url": "https://cointelegraph.com/rss", "homepage": "https://cointelegraph.com", "category_slug": "crypto"},
    # --- Business ---
    {"name": "CNBC Business", "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", "homepage": "https://www.cnbc.com", "category_slug": "business"},
    {"name": "BBC Business", "url": "https://feeds.bbci.co.uk/news/business/rss.xml", "homepage": "https://www.bbc.com/news/business", "category_slug": "business"},
    # --- Lifestyle ---
    {"name": "NPR Life Kit", "url": "https://feeds.npr.org/510338/podcast.xml", "homepage": "https://www.npr.org/lifekit", "category_slug": "lifestyle"},
    {"name": "Lifehacker", "url": "https://lifehacker.com/feed/rss", "homepage": "https://lifehacker.com", "category_slug": "lifestyle"},
    # --- Marketing ---
    {"name": "Search Engine Journal", "url": "https://www.searchenginejournal.com/feed/", "homepage": "https://www.searchenginejournal.com", "category_slug": "marketing"},
    {"name": "Search Engine Land", "url": "https://searchengineland.com/feed", "homepage": "https://searchengineland.com", "category_slug": "marketing"},
]

REWRITE_NOTICE = (
    '<div class="editor-notice" data-rewrite-required="true">'
    "<strong>Rewrite required before publishing.</strong> This draft holds only the "
    "source headline, the publisher's own syndicated summary and a link back. Replace "
    "the body with your own original reporting or analysis, then delete this box. "
    "Publishing copied text breaks copyright and Google AdSense policy."
    "</div>"
)


def seed_sources(db: Session) -> int:
    added = 0
    for spec in DEFAULT_SOURCES:
        exists = db.query(FeedSource).filter(FeedSource.url == spec["url"]).one_or_none()
        if not exists:
            db.add(FeedSource(**spec))
            added += 1
    db.commit()
    return added


def _parse_date(entry) -> datetime | None:
    for key in ("published_parsed", "updated_parsed"):
        value = getattr(entry, key, None)
        if value:
            return datetime.fromtimestamp(mktime(value), tz=timezone.utc)
    return None


def _extract_image(entry) -> str:
    for media_key in ("media_content", "media_thumbnail"):
        media = getattr(entry, media_key, None)
        if media:
            url = media[0].get("url")
            if url:
                return url
    for enc in getattr(entry, "enclosures", []) or []:
        if str(enc.get("type", "")).startswith("image/") and enc.get("href"):
            return enc["href"]
    for key in ("summary", "description"):
        html = getattr(entry, key, "") or ""
        match = re.search(r'<img[^>]+src="([^"]+)"', html)
        if match:
            return match.group(1)
    return ""


async def fetch_source(db: Session, source: FeedSource, limit: int = 25) -> tuple[int, str]:
    """Pull one feed. Returns (new_items, status_message)."""
    try:
        async with httpx.AsyncClient(
            timeout=20, follow_redirects=True, headers={"User-Agent": USER_AGENT}
        ) as client:
            response = await client.get(source.url)
            response.raise_for_status()
            raw = response.content
    except Exception as exc:  # noqa: BLE001 - one bad feed must not stop the run
        source.last_status = f"error: {exc}"[:300]
        source.last_fetched_at = datetime.now(timezone.utc)
        db.commit()
        return 0, source.last_status

    parsed = feedparser.parse(raw)
    new_count = 0
    for entry in parsed.entries[:limit]:
        guid = getattr(entry, "id", "") or getattr(entry, "link", "")
        if not guid:
            continue
        if db.query(FeedItem).filter(FeedItem.guid == guid).one_or_none():
            continue
        summary_html = getattr(entry, "summary", "") or getattr(entry, "description", "")
        db.add(
            FeedItem(
                source_id=source.id,
                guid=guid[:800],
                title=strip_tags(getattr(entry, "title", ""))[:500] or "Untitled",
                summary=strip_tags(summary_html)[:1200],
                link=(getattr(entry, "link", "") or "")[:800],
                image=_extract_image(entry)[:800],
                author=strip_tags(getattr(entry, "author", ""))[:200],
                category_slug=source.category_slug,
                published_at=_parse_date(entry),
            )
        )
        new_count += 1

    source.last_fetched_at = datetime.now(timezone.utc)
    source.last_status = f"ok: {new_count} new of {len(parsed.entries)} entries"
    db.commit()
    return new_count, source.last_status


async def ingest_all(db: Session, limit_per_source: int = 25) -> dict:
    sources = db.query(FeedSource).filter(FeedSource.is_active.is_(True)).all()
    total_new = 0
    errors: list[str] = []
    for source in sources:
        count, status = await fetch_source(db, source, limit=limit_per_source)
        total_new += count
        if status.startswith("error"):
            errors.append(f"{source.name}: {status}")
    return {"sources_checked": len(sources), "new_items": total_new, "errors": errors}


def import_item_as_draft(
    db: Session, item: FeedItem, author: User, category_id: int | None = None
) -> Post:
    """Turn a feed headline into a draft the newsroom rewrites."""
    if item.imported_post_id:
        existing = db.get(Post, item.imported_post_id)
        if existing:
            return existing

    category = None
    if category_id:
        category = db.get(Category, category_id)
    if category is None:
        category = (
            db.query(Category).filter(Category.slug == item.category_slug).one_or_none()
            or db.query(Category).filter(Category.slug == "news").one_or_none()
        )

    source_name = item.source.name if item.source else ""
    body = (
        f"{REWRITE_NOTICE}"
        f"<h2>What happened</h2><p>{item.summary}</p>"
        f"<h2>Why it matters</h2><p>Add your own analysis here.</p>"
        f'<p>Source: <a href="{item.link}" target="_blank" rel="noopener noreferrer nofollow">'
        f"{source_name or item.link}</a></p>"
    )

    post = Post(
        title=item.title[:300],
        slug=unique_slug(db, Post, item.title),
        excerpt=make_excerpt(item.summary),
        content=sanitize_html(body),
        cover_image=item.image or "",
        cover_alt=item.title[:300],
        category_id=category.id if category else None,
        author_id=author.id,
        status=PostStatus.draft,
        meta_title=item.title[:60],
        meta_description=make_excerpt(item.summary, 155),
        source_name=source_name,
        source_url=item.link,
        published_at=item.published_at,
    )
    db.add(post)
    db.flush()
    item.imported_post_id = post.id
    db.commit()
    db.refresh(post)
    return post
