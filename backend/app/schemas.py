from __future__ import annotations

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, computed_field, field_validator

from app.models import PostStatus, Role
from app.utils.seo import iso_utc, normalize_canonical, post_url

# SQLite drops tzinfo, so re-attach UTC before serialising. Google requires a
# timezone offset on datePublished / article:published_time.
_as_utc_iso = iso_utc


UTCDateTime = Annotated[datetime, PlainSerializer(_as_utc_iso, return_type=str, when_used="json")]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------- Auth ----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    bio: str = ""
    avatar: str = ""
    twitter: str = ""
    role: Role = Role.author
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    bio: str | None = None
    avatar: str | None = None
    twitter: str | None = None
    role: Role | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserOut(ORMModel):
    id: int
    name: str
    slug: str
    email: EmailStr
    role: Role
    bio: str = ""
    avatar: str = ""
    twitter: str = ""
    is_active: bool = True


class AuthorPublic(ORMModel):
    id: int
    name: str
    slug: str
    bio: str = ""
    avatar: str = ""
    twitter: str = ""


# ---------------- Taxonomy ----------------
class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""
    meta_title: str = ""
    meta_description: str = ""
    color: str = "#03305f"
    icon: str = ""
    position: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    slug: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    color: str | None = None
    icon: str | None = None
    position: int | None = None
    is_active: bool | None = None


class CategoryOut(ORMModel):
    id: int
    name: str
    slug: str
    description: str = ""
    meta_title: str = ""
    meta_description: str = ""
    color: str = ""
    icon: str = ""
    position: int = 0
    is_active: bool = True


class CategoryWithCount(CategoryOut):
    post_count: int = 0


class TagOut(ORMModel):
    id: int
    name: str
    slug: str


# ---------------- Posts ----------------
class PostImageIn(BaseModel):
    url: str
    alt: str = ""
    caption: str = ""
    credit: str = ""
    position: int = 0


class PostImageOut(ORMModel):
    id: int
    url: str
    alt: str = ""
    caption: str = ""
    credit: str = ""
    position: int = 0


class PostBase(BaseModel):
    title: str = Field(min_length=5, max_length=300)
    excerpt: str = ""
    content: str = ""
    cover_image: str = ""
    cover_alt: str = ""
    cover_caption: str = ""
    category_id: int | None = None
    status: PostStatus = PostStatus.draft
    published_at: UTCDateTime | None = None
    meta_title: str = ""
    meta_description: str = ""
    meta_keywords: str = ""
    focus_keyword: str = ""
    canonical_url: str = ""
    og_image: str = ""
    no_index: bool = False
    is_featured: bool = False
    is_breaking: bool = False
    is_editors_pick: bool = False
    source_name: str = ""
    source_url: str = ""

    @field_validator("canonical_url", mode="before")
    @classmethod
    def _clean_canonical(cls, value: str | None) -> str:
        return normalize_canonical(value)


class PostCreate(PostBase):
    slug: str | None = None
    tags: list[str] = []
    images: list[PostImageIn] = []
    author_id: int | None = None


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=300)
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    cover_image: str | None = None
    cover_alt: str | None = None
    cover_caption: str | None = None
    category_id: int | None = None
    status: PostStatus | None = None
    published_at: UTCDateTime | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    meta_keywords: str | None = None
    focus_keyword: str | None = None
    canonical_url: str | None = None
    og_image: str | None = None
    no_index: bool | None = None
    is_featured: bool | None = None
    is_breaking: bool | None = None
    is_editors_pick: bool | None = None
    author_id: int | None = None
    source_name: str | None = None
    source_url: str | None = None
    tags: list[str] | None = None
    images: list[PostImageIn] | None = None

    @field_validator("canonical_url", mode="before")
    @classmethod
    def _clean_canonical(cls, value: str | None) -> str | None:
        return None if value is None else normalize_canonical(value)


class PostCard(ORMModel):
    """Trimmed shape used by every listing grid - keeps payloads small."""

    id: int
    title: str
    slug: str
    excerpt: str = ""
    cover_image: str = ""
    cover_alt: str = ""
    published_at: UTCDateTime | None = None
    reading_time: int = 1
    views: int = 0
    is_featured: bool = False
    is_breaking: bool = False
    category: CategoryOut | None = None
    author: AuthorPublic | None = None


class PostOut(PostCard):
    content: str = ""
    cover_caption: str = ""
    status: PostStatus
    created_at: UTCDateTime
    updated_at: UTCDateTime
    meta_title: str = ""
    meta_description: str = ""
    meta_keywords: str = ""
    focus_keyword: str = ""
    canonical_url: str = ""
    og_image: str = ""
    no_index: bool = False
    is_editors_pick: bool = False
    source_name: str = ""
    source_url: str = ""
    tags: list[TagOut] = []
    images: list[PostImageOut] = []

    @computed_field  # type: ignore[prop-decorator]
    @property
    def url(self) -> str:
        """Absolute permalink - /<category>/<slug> on the public site."""
        return post_url({"slug": self.slug, "category": {"slug": self.category.slug} if self.category else None})

    @computed_field  # type: ignore[prop-decorator]
    @property
    def canonical(self) -> str:
        """What <link rel="canonical"> should say: the editor's override or the article itself."""
        return self.canonical_url or self.url


class Paginated(BaseModel):
    items: list[PostCard]
    total: int
    page: int
    per_page: int
    pages: int


class AdminPaginated(BaseModel):
    items: list[PostOut]
    total: int
    page: int
    per_page: int
    pages: int


# ---------------- Media ----------------
class MediaOut(ORMModel):
    id: int
    filename: str
    url: str
    thumb_url: str = ""
    mime: str = ""
    width: int = 0
    height: int = 0
    size_bytes: int = 0
    alt: str = ""
    created_at: UTCDateTime


# ---------------- Misc ----------------
class SubscribeIn(BaseModel):
    email: EmailStr


class SettingIn(BaseModel):
    key: str
    value: str


class SeoAnalysisIn(BaseModel):
    title: str = ""
    meta_title: str = ""
    meta_description: str = ""
    content: str = ""
    focus_keyword: str = ""
    cover_image: str = ""
    slug: str = ""
    category_slug: str = ""
    canonical_url: str = ""


class DashboardStats(BaseModel):
    total_posts: int
    published: int
    drafts: int
    scheduled: int
    total_views: int
    subscribers: int
    per_category: list[dict]
    recent: list[PostCard]


Token.model_rebuild()
