"""First-run setup: create tables, the admin user and the eight categories."""

from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, apply_mysql_table_options, engine
from app.models import Category, PageSeo, Role, Setting, User
from app.services.categories import reorder_categories
from app.services.posts import strip_chatgpt_links, trim_breaking
from app.services.purge import remove_crypto
from app.utils.security import hash_password
from app.utils.text import slugify

CATEGORIES: list[dict] = [
    {
        "name": "News",
        "slug": "news",
        "color": "#03305f",
        "icon": "newspaper",
        "description": "Breaking US and world headlines, politics and the stories shaping the day.",
        "meta_title": "Latest US & World News Headlines",
        "meta_description": "Breaking news from across the United States and around the world - politics, policy and the day's biggest stories, updated continuously.",
    },
    {
        "name": "Health",
        "slug": "health",
        "color": "#0f8a5f",
        "icon": "heart-pulse",
        "description": "Medical research, public health, nutrition, fitness and wellbeing.",
        "meta_title": "Health News, Medical Research & Wellness",
        "meta_description": "Evidence-based health news: medical research, nutrition, mental health, fitness and public health guidance you can actually use.",
    },
    {
        "name": "Sports",
        "slug": "sports",
        "color": "#d2441f",
        "icon": "trophy",
        "description": "NFL, NBA, MLB, NHL, soccer and college sports coverage.",
        "meta_title": "Sports News, Scores & Analysis",
        "meta_description": "Sports coverage across the NFL, NBA, MLB, NHL, college and world soccer - scores, trades, injuries and analysis.",
    },
    {
        "name": "Entertainment",
        "slug": "entertainment",
        "color": "#8b2fc9",
        "icon": "clapperboard",
        "description": "Film, television, streaming, music and celebrity news.",
        "meta_title": "Entertainment News: Movies, TV, Music & Celebrity",
        "meta_description": "Entertainment coverage - box office, streaming releases, television, music and the people behind them.",
    },
    {
        "name": "Business",
        "slug": "business",
        "color": "#1a6ea8",
        "icon": "briefcase",
        "description": "Markets, the economy, companies, startups and jobs.",
        "meta_title": "Business & Economy News",
        "meta_description": "Business news covering the stock market, the economy, earnings, startups, jobs and the companies driving them.",
    },
    {
        "name": "Lifestyle",
        "slug": "lifestyle",
        "color": "#c0396b",
        "icon": "sparkles",
        "description": "Travel, food, home, relationships, style and personal finance.",
        "meta_title": "Lifestyle: Travel, Food, Home & Style",
        "meta_description": "Lifestyle features on travel, food, home, relationships, style and money - practical ideas for everyday life.",
    },
    {
        "name": "Marketing",
        "slug": "marketing",
        "color": "#2b9c8f",
        "icon": "megaphone",
        "description": "SEO, paid media, social, content strategy and martech.",
        "meta_title": "Marketing News: SEO, Ads, Social & Content",
        "meta_description": "Digital marketing coverage - SEO and Google algorithm updates, paid media, social platforms, content strategy and martech.",
    },
]

DEFAULT_SETTINGS: dict[str, str] = {
    "site_name": settings.site_name,
    "site_tagline": settings.site_tagline,
    "adsense_client": "",          # ca-pub-XXXXXXXXXXXXXXXX
    "adsense_slot_header": "",
    "adsense_slot_in_feed": "",
    "adsense_slot_in_article": "",
    "adsense_slot_sidebar": "",
    "adsense_slot_sidebar_2": "",
    "adsense_slot_footer": "",
    "adsense_auto_ads": "false",
    "ga_measurement_id": "",       # G-XXXXXXX
    "gsc_verification": "",
    "twitter_handle": "@dailyuswire",
    "facebook_url": "",
    "youtube_url": "",
    "contact_email": "info@dailyuswire.com",
}


def ensure_categories(db: Session) -> int:
    created = 0
    for i, spec in enumerate(CATEGORIES):
        existing = db.query(Category).filter(Category.slug == spec["slug"]).one_or_none()
        if existing:
            continue
        db.add(Category(**spec, position=i))
        created += 1
    db.commit()
    return created


def ensure_admin(db: Session) -> User:
    email = settings.admin_email.lower().strip()
    user = db.query(User).filter(User.email == email).one_or_none()
    if user:
        return user
    user = User(
        email=email,
        name=settings.admin_name,
        slug=slugify(settings.admin_name),
        hashed_password=hash_password(settings.admin_password),
        role=Role.admin,
        bio=f"Editorial desk at {settings.site_name}.",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


PAGE_SEO: list[dict] = [
    {
        "slug": "home",
        "label": "Home page",
        "path": "/",
        "meta_title": f"{settings.site_name} - Breaking US News, Health, Sports, Tech & Business",
        "meta_description": "Daily US Wire delivers breaking US news plus original reporting on health, sports, technology, entertainment, business, lifestyle and marketing.",
    },
    {
        "slug": "about",
        "label": "About page",
        "path": "/about",
        "meta_title": "About Us",
        "meta_description": f"Who we are, what we cover and how {settings.site_name} reports the news across eight desks.",
    },
    {
        "slug": "contact",
        "label": "Contact page",
        "path": "/contact",
        "meta_title": "Contact Us",
        "meta_description": f"Get in touch with the {settings.site_name} team with questions, feedback or enquiries.",
    },
]


def ensure_page_seo(db: Session) -> None:
    """Seed the fixed pages once; later edits made in the admin are never overwritten."""
    for row in PAGE_SEO:
        if not db.get(PageSeo, row["slug"]):
            db.add(PageSeo(**row))
    db.commit()


def ensure_settings(db: Session) -> None:
    for key, value in DEFAULT_SETTINGS.items():
        if not db.get(Setting, key):
            db.add(Setting(key=key, value=value))
    db.commit()


# Columns added to existing tables after launch. create_all() only creates
# missing tables, so add these to databases that predate them.
ADDED_COLUMNS: dict[str, dict[str, str]] = {
    "users": {"linkedin": "VARCHAR(300) NOT NULL DEFAULT ''"},
}


def ensure_columns() -> None:
    inspector = inspect(engine)
    for table, columns in ADDED_COLUMNS.items():
        existing = {c["name"] for c in inspector.get_columns(table)}
        for name, ddl in columns.items():
            if name not in existing:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


# LinkedIn profile for the desk byline, shown under every article. Applied
# once (tracked in settings) so clearing or changing it in Team sticks.
STAFF_AUTHOR_SLUG = "daily-us-wire-staff"
STAFF_AUTHOR_LINKEDIN = "https://www.linkedin.com/in/ahmad-iftikhar/"
_STAFF_LINKEDIN_FLAG = "seeded_staff_linkedin"


def link_staff_author(db: Session) -> None:
    if db.get(Setting, _STAFF_LINKEDIN_FLAG):
        return
    user = db.query(User).filter(User.slug == STAFF_AUTHOR_SLUG).one_or_none()
    if user and not user.linkedin:
        user.linkedin = STAFF_AUTHOR_LINKEDIN
    db.add(Setting(key=_STAFF_LINKEDIN_FLAG, value="1"))
    db.commit()


def run() -> None:
    # Models are all imported by now, so every table is in the metadata.
    apply_mysql_table_options()
    Base.metadata.create_all(bind=engine)
    ensure_columns()
    with SessionLocal() as db:
        remove_crypto(db)  # the Crypto desk was retired; see services/purge.py
        ensure_categories(db)
        ensure_admin(db)
        ensure_settings(db)
        ensure_page_seo(db)
        reorder_categories(db)  # clears any duplicate nav orders saved earlier
        trim_breaking(db)
        strip_chatgpt_links(db)  # ChatGPT tracking tags on cited links
        link_staff_author(db)
        db.commit()
