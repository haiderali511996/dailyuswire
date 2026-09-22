"""Slugs, HTML sanitising, excerpts, reading time and SEO scoring."""

from __future__ import annotations

import re

import bleach
from bleach.css_sanitizer import CSSSanitizer
from slugify import slugify as _slugify
from sqlalchemy.orm import Session

from app.utils.seo import normalize_canonical, post_url

ALLOWED_TAGS = [
    "p", "br", "hr", "span", "div", "strong", "b", "em", "i", "u", "s", "sub", "sup",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "blockquote", "pre", "code", "cite", "q", "abbr", "mark", "small",
    "a", "img", "figure", "figcaption", "picture", "source",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "colgroup", "col",
    "iframe", "video", "audio",
]

ALLOWED_ATTRS = {
    "*": ["class", "id", "style", "title", "dir", "lang"],
    "a": ["href", "target", "rel", "download"],
    "img": ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    "source": ["src", "srcset", "type", "media", "sizes"],
    "iframe": ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "loading", "title"],
    "video": ["src", "controls", "poster", "width", "height", "preload", "muted", "playsinline"],
    "audio": ["src", "controls", "preload"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan", "scope"],
    "col": ["span", "width"],
    "ol": ["start", "type"],
}

CSS_SANITIZER = CSSSanitizer(
    allowed_css_properties=[
        "color", "background-color", "text-align", "font-weight", "font-style",
        "text-decoration", "width", "height", "margin", "padding", "border",
        "float", "max-width", "font-size", "line-height",
    ]
)

ALLOWED_PROTOCOLS = ["http", "https", "mailto", "tel", "data"]


def sanitize_html(html: str) -> str:
    """Strip anything that could execute. Editor output is never trusted."""
    if not html:
        return ""
    cleaned = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=ALLOWED_PROTOCOLS,
        css_sanitizer=CSS_SANITIZER,
        strip=True,
    )
    # Force external links to be safe + SEO friendly.
    return re.sub(
        r'<a\s+([^>]*?)href="(https?://[^"]+)"([^>]*)>',
        lambda m: f'<a {m.group(1)}href="{m.group(2)}"{m.group(3)} rel="noopener noreferrer">',
        cleaned,
    )


def strip_tags(html: str) -> str:
    text = re.sub(r"<[^>]+>", " ", html or "")
    return re.sub(r"\s+", " ", bleach.clean(text, tags=[], strip=True)).strip()


def slugify(value: str, max_length: int = 80) -> str:
    return _slugify(value or "", max_length=max_length) or "post"


def unique_slug(db: Session, model, value: str, exclude_id: int | None = None) -> str:
    base = slugify(value)
    slug = base
    n = 2
    while True:
        q = db.query(model).filter(model.slug == slug)
        if exclude_id is not None:
            q = q.filter(model.id != exclude_id)
        if not db.query(q.exists()).scalar():
            return slug
        slug = f"{base}-{n}"
        n += 1


def make_excerpt(html: str, limit: int = 160) -> str:
    text = strip_tags(html)
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0]
    return f"{cut}..."


def reading_time(html: str, wpm: int = 225) -> int:
    words = len(strip_tags(html).split())
    return max(1, round(words / wpm))


def extract_images(html: str) -> list[str]:
    return re.findall(r'<img[^>]+src="([^"]+)"', html or "")


def heading_outline(html: str) -> list[dict]:
    """Used for the article table of contents / breadcrumb schema."""
    out = []
    for level, inner in re.findall(r"<h([23])[^>]*>(.*?)</h\1>", html or "", flags=re.S | re.I):
        text = strip_tags(inner)
        if text:
            out.append({"level": int(level), "text": text, "id": slugify(text)})
    return out


def add_heading_ids(html: str) -> str:
    """Give every h2/h3 a stable id so the ToC and deep links work."""

    def repl(m: re.Match) -> str:
        tag, attrs, inner = m.group(1), m.group(2), m.group(3)
        if "id=" in attrs:
            return m.group(0)
        return f'<h{tag}{attrs} id="{slugify(strip_tags(inner))}">{inner}</h{tag}>'

    return re.sub(r"<h([23])([^>]*)>(.*?)</h\1>", repl, html or "", flags=re.S | re.I)


def seo_score(
    *,
    title: str,
    meta_title: str,
    meta_description: str,
    content: str,
    focus_keyword: str,
    cover_image: str,
    slug: str = "",
    category_slug: str = "",
    canonical_url: str = "",
) -> dict:
    """A Yoast-style checklist the admin editor renders live."""
    text = strip_tags(content)
    words = text.split()
    word_count = len(words)
    kw = (focus_keyword or "").strip().lower()
    lower_text = text.lower()
    mt = meta_title or title
    checks: list[dict] = []

    def add(ok: bool, label: str, hint: str, weight: int = 1) -> None:
        checks.append({"ok": ok, "label": label, "hint": hint, "weight": weight})

    add(30 <= len(mt) <= 60, "Meta title length",
        f"{len(mt)} chars - aim for 30-60 so Google does not truncate it.", 2)
    add(120 <= len(meta_description) <= 160, "Meta description length",
        f"{len(meta_description)} chars - aim for 120-160.", 2)
    add(word_count >= 600, "Article length",
        f"{word_count} words - 600+ ranks and monetises far better.", 2)
    add(bool(cover_image), "Cover image set", "Every article needs a cover image for OG/Twitter cards.", 1)
    add(len(heading_outline(content)) >= 2, "Subheadings",
        "Use at least two H2/H3 subheadings to structure the article.", 1)
    add('href="http' in (content or ""), "Outbound links",
        "Link to at least one authoritative source.", 1)

    self_url = post_url({"slug": slug or "your-slug", "category": {"slug": category_slug or "news"}})
    try:
        custom = normalize_canonical(canonical_url)
    except ValueError as exc:
        add(False, "Canonical URL", f"{exc}. Leave it blank to point at this article.", 1)
    else:
        if not custom or custom == self_url:
            add(True, "Canonical URL", f"Set automatically to {self_url}", 1)
        else:
            add(True, "Canonical URL",
                f"Points at {custom} - search engines will credit that page, not this one. "
                "Only keep this if the article is republished from there.", 1)

    if kw:
        density = lower_text.count(kw) / word_count * 100 if word_count else 0
        add(kw in (title or "").lower(), "Keyword in title", f'"{focus_keyword}" should appear in the H1.', 2)
        add(kw in (meta_description or "").lower(), "Keyword in meta description",
            f'"{focus_keyword}" should appear in the meta description.', 1)
        add(kw in " ".join(words[:60]).lower(), "Keyword in intro",
            "Mention the focus keyword in the first paragraph.", 1)
        add(0.5 <= density <= 2.5, "Keyword density",
            f"{density:.2f}% - keep it between 0.5% and 2.5%.", 1)
    else:
        add(False, "Focus keyword", "Set a focus keyword to unlock keyword checks.", 2)

    total = sum(c["weight"] for c in checks)
    earned = sum(c["weight"] for c in checks if c["ok"])
    score = round(earned / total * 100) if total else 0
    grade = "good" if score >= 80 else "ok" if score >= 55 else "poor"
    return {"score": score, "grade": grade, "word_count": word_count, "checks": checks}
