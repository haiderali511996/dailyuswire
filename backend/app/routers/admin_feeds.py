"""Admin: the newsroom wire - pull headlines, turn them into drafts."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import joinedload

from app.deps import CurrentUser, DbSession, EditorUser
from app.models import FeedItem, FeedSource
from app.schemas import (
    FeedItemOut,
    FeedSourceIn,
    FeedSourceOut,
    ImportRequest,
    IngestResult,
    PostOut,
)
from app.services.ingest import ingest_all, import_item_as_draft, seed_sources

router = APIRouter(prefix="/api/admin/feeds", tags=["admin:feeds"])


@router.get("/sources", response_model=list[FeedSourceOut])
def list_sources(db: DbSession, user: CurrentUser) -> list[FeedSource]:
    return db.query(FeedSource).order_by(FeedSource.category_slug, FeedSource.name).all()


@router.post("/sources", response_model=FeedSourceOut, status_code=201)
def add_source(db: DbSession, user: EditorUser, payload: FeedSourceIn) -> FeedSource:
    if db.query(FeedSource).filter(FeedSource.url == payload.url).one_or_none():
        raise HTTPException(status_code=409, detail="That feed is already registered")
    source = FeedSource(**payload.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


@router.delete("/sources/{source_id}", status_code=204)
def remove_source(db: DbSession, user: EditorUser, source_id: int) -> None:
    source = db.get(FeedSource, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Feed source not found")
    db.delete(source)
    db.commit()


@router.post("/sources/seed-defaults", response_model=dict)
def seed_defaults(db: DbSession, user: EditorUser) -> dict:
    return {"added": seed_sources(db)}


@router.post("/fetch", response_model=IngestResult)
async def fetch_now(
    db: DbSession, user: EditorUser, limit_per_source: int = Query(25, ge=1, le=100)
) -> IngestResult:
    return IngestResult(**await ingest_all(db, limit_per_source=limit_per_source))


@router.get("/items", response_model=list[FeedItemOut])
def list_items(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(30, ge=1, le=100),
    category_slug: str | None = None,
    only_pending: bool = True,
) -> list[FeedItem]:
    query = db.query(FeedItem).options(joinedload(FeedItem.source))
    if category_slug:
        query = query.filter(FeedItem.category_slug == category_slug)
    if only_pending:
        query = query.filter(FeedItem.imported_post_id.is_(None))
    return (
        # `nullslast()` compiles to "NULLS LAST", which MySQL and MariaDB reject
        # outright. Ordering on the null test first is portable: False (0) sorts
        # before True (1), so rows with a date come first.
        query.order_by(
            FeedItem.published_at.is_(None),
            FeedItem.published_at.desc(),
            FeedItem.fetched_at.desc(),
        )
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )


@router.post("/import", response_model=list[PostOut], status_code=201)
def import_items(db: DbSession, user: CurrentUser, payload: ImportRequest) -> list:
    """Create DRAFT posts from selected wire items. Never publishes."""
    items = db.query(FeedItem).filter(FeedItem.id.in_(payload.feed_item_ids)).all()
    if not items:
        raise HTTPException(status_code=404, detail="No matching wire items")
    return [import_item_as_draft(db, item, user, payload.category_id) for item in items]
