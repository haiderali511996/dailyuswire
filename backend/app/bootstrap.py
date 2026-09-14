"""First-run setup: create tables, the admin user, the eight categories, feeds."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Category, Role, Setting, User
from app.services.ingest import seed_sources
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
        "name": "Crypto",
        "slug": "crypto",
        "color": "#e8a317",
        "icon": "bitcoin",
        "description": "Bitcoin, Ethereum, altcoins, DeFi, regulation and market moves.",
        "meta_title": "Crypto News: Bitcoin, Ethereum & Market Analysis",
        "meta_description": "Cryptocurrency news and analysis - Bitcoin and Ethereum prices, DeFi, regulation, exchanges and blockchain technology.",
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
    "adsense_slot_in_article": "",
    "adsense_slot_sidebar": "",
    "adsense_auto_ads": "false",
    "ga_measurement_id": "",       # G-XXXXXXX
    "gsc_verification": "",
    "twitter_handle": "@dailyuswire",
    "facebook_url": "",
    "youtube_url": "",
    "contact_email": "editor@dailyuswire.com",
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


def ensure_settings(db: Session) -> None:
    for key, value in DEFAULT_SETTINGS.items():
        if not db.get(Setting, key):
            db.add(Setting(key=key, value=value))
    db.commit()


def run() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        ensure_categories(db)
        ensure_admin(db)
        ensure_settings(db)
        seed_sources(db)
