from __future__ import annotations

import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Role(str, enum.Enum):
    admin = "admin"
    editor = "editor"
    author = "author"


class PostStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    published = "published"
    archived = "archived"


post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.author)
    bio: Mapped[str] = mapped_column(Text, default="")
    avatar: Mapped[str] = mapped_column(String(500), default="")
    twitter: Mapped[str] = mapped_column(String(120), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    posts: Mapped[list[Post]] = relationship(back_populates="author")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    meta_title: Mapped[str] = mapped_column(String(255), default="")
    meta_description: Mapped[str] = mapped_column(String(500), default="")
    color: Mapped[str] = mapped_column(String(20), default="#03305f")
    icon: Mapped[str] = mapped_column(String(40), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    posts: Mapped[list[Post]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)

    posts: Mapped[list[Post]] = relationship(secondary=post_tags, back_populates="tags")


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(300), index=True)
    slug: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    excerpt: Mapped[str] = mapped_column(Text, default="")
    content: Mapped[str] = mapped_column(Text, default="")

    cover_image: Mapped[str] = mapped_column(String(600), default="")
    cover_alt: Mapped[str] = mapped_column(String(300), default="")
    cover_caption: Mapped[str] = mapped_column(String(400), default="")

    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)

    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus), default=PostStatus.draft, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # SEO
    meta_title: Mapped[str] = mapped_column(String(255), default="")
    meta_description: Mapped[str] = mapped_column(String(500), default="")
    meta_keywords: Mapped[str] = mapped_column(String(500), default="")
    focus_keyword: Mapped[str] = mapped_column(String(120), default="")
    canonical_url: Mapped[str] = mapped_column(String(600), default="")
    og_image: Mapped[str] = mapped_column(String(600), default="")
    no_index: Mapped[bool] = mapped_column(Boolean, default=False)

    # Flags / stats
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_breaking: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_editors_pick: Mapped[bool] = mapped_column(Boolean, default=False)
    reading_time: Mapped[int] = mapped_column(Integer, default=1)
    views: Mapped[int] = mapped_column(Integer, default=0)

    # Provenance (for drafts created from a news feed)
    source_name: Mapped[str] = mapped_column(String(200), default="")
    source_url: Mapped[str] = mapped_column(String(800), default="")

    category: Mapped[Category | None] = relationship(back_populates="posts")
    author: Mapped[User | None] = relationship(back_populates="posts")
    tags: Mapped[list[Tag]] = relationship(secondary=post_tags, back_populates="posts")
    images: Mapped[list[PostImage]] = relationship(
        back_populates="post", cascade="all, delete-orphan", order_by="PostImage.position"
    )


class PostImage(Base):
    """Gallery / in-article images. A post carries 3-5 of these."""

    __tablename__ = "post_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(600))
    alt: Mapped[str] = mapped_column(String(300), default="")
    caption: Mapped[str] = mapped_column(String(400), default="")
    credit: Mapped[str] = mapped_column(String(200), default="")
    position: Mapped[int] = mapped_column(Integer, default=0)

    post: Mapped[Post] = relationship(back_populates="images")


class Media(Base):
    __tablename__ = "media"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(300))
    url: Mapped[str] = mapped_column(String(600))
    thumb_url: Mapped[str] = mapped_column(String(600), default="")
    mime: Mapped[str] = mapped_column(String(100), default="")
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    alt: Mapped[str] = mapped_column(String(300), default="")
    uploaded_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Subscriber(Base):
    __tablename__ = "subscribers"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Setting(Base):
    """Key/value site settings: AdSense slots, analytics IDs, social links, etc."""

    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String(120), primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="")
