"""Structured data (JSON-LD) builders shared by the public API."""

from __future__ import annotations

from app.config import settings


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
    site = settings.site_url.rstrip("/")
    url = f"{site}/{post['category']['slug']}/{post['slug']}" if post.get("category") else f"{site}/{post['slug']}"
    images = [_abs(post["cover_image"])] if post.get("cover_image") else []
    images += [_abs(i["url"]) for i in post.get("images", [])]
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
