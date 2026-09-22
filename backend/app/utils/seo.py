"""Structured data (JSON-LD) builders shared by the public API."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from app.config import settings

# Query parameters that never change the page and must not leak into a canonical.
TRACKING_PARAMS = ("utm_", "fbclid", "gclid", "dclid", "msclkid", "mc_cid", "mc_eid", "ref", "igshid")


def site_root() -> str:
    return settings.site_url.rstrip("/")


def iso_utc(value: datetime | None) -> str | None:
    """ISO-8601 with an explicit UTC offset.

    SQLite and MySQL hand back naive datetimes. Google rejects a
    ``<news:publication_date>`` or ``datePublished`` without a timezone, so
    every timestamp that leaves the API goes through here.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def post_url(post) -> str:
    """The one public address of an article: /<category>/<slug>.

    Accepts an ORM Post or a serialised dict. Every place that emits an article
    link (JSON-LD, RSS, sitemaps, revalidation, canonical) goes through here so
    they can never disagree with each other.
    """
    if isinstance(post, dict):
        category = (post.get("category") or {}).get("slug")
        slug = post["slug"]
    else:
        category = post.category.slug if getattr(post, "category", None) else None
        slug = post.slug
    return f"{site_root()}/{category or 'news'}/{slug}"


def normalize_canonical(value: str | None) -> str:
    """Turn whatever an editor typed into a clean absolute canonical URL.

    Returns "" for blank input, meaning "the article is its own canonical" and
    the front end derives it from the category and slug at render time - so it
    can never go stale when a slug or section changes.

    Accepts a bare path (``/news/some-slug``), a scheme-less host
    (``example.com/story``) or a full URL. Strips whitespace, fragments,
    tracking parameters and trailing slashes. Raises ValueError for anything
    that cannot be made into an http(s) URL, so the API answers 422 instead
    of shipping a broken ``<link rel="canonical">``.
    """
    raw = (value or "").strip()
    if not raw:
        return ""
    if raw.startswith("/"):
        raw = f"{site_root()}{raw}"
    elif not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
        raw = f"https://{raw}"

    parts = urlsplit(raw)
    if parts.scheme not in ("http", "https") or not parts.netloc or "." not in parts.netloc:
        raise ValueError("Canonical URL must be a full web address, e.g. https://example.com/story")
    if any(ch.isspace() for ch in raw):
        raise ValueError("Canonical URL must not contain spaces")

    query = [
        (k, v)
        for k, v in parse_qsl(parts.query, keep_blank_values=True)
        if not k.lower().startswith(TRACKING_PARAMS)
    ]
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), path, urlencode(query), ""))


def _abs(url: str) -> str:
    """Absolute URL for structured data.

    Uploads resolve against the public site URL, not the API URL: the front end
    proxies /media through its own domain, and Google expects image URLs on the
    same host as the article.
    """
    if not url:
        return ""
    if url.startswith(("http://", "https://")):
        return url
    return f"{settings.site_url.rstrip('/')}{url if url.startswith('/') else '/' + url}"


def organization() -> dict:
    site = settings.site_url.rstrip("/")
    return {
        "@type": "NewsMediaOrganization",
        "@id": f"{site}/#organization",
        "name": settings.site_name,
        "url": site,
        "logo": {"@type": "ImageObject", "url": f"{site}/logo.png", "width": 2172, "height": 724},
    }


def breadcrumbs(items: list[tuple[str, str]]) -> dict:
    site = settings.site_url.rstrip("/")
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i,
                "name": name,
                "item": f"{site}{path}" if path else None,
            }
            for i, (name, path) in enumerate(items, start=1)
        ],
    }


def news_article(post: dict) -> dict:
    site = site_root()
    url = post_url(post)
    images = [_abs(post["cover_image"])] if post.get("cover_image") else []
    return {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "headline": (post.get("meta_title") or post["title"])[:110],
        "description": post.get("meta_description") or post.get("excerpt", ""),
        "image": [i for i in images if i][:5],
        "datePublished": post.get("published_at"),
        "dateModified": post.get("updated_at") or post.get("published_at"),
        "articleSection": (post.get("category") or {}).get("name"),
        "keywords": post.get("meta_keywords") or ", ".join(t["name"] for t in post.get("tags", [])),
        "wordCount": post.get("word_count"),
        "author": {
            "@type": "Person",
            "name": (post.get("author") or {}).get("name", settings.site_name),
            "url": f"{site}/author/{(post.get('author') or {}).get('slug', '')}",
        },
        "publisher": organization(),
    }
