"""Category helpers shared by the admin router and startup."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Category


def reorder_categories(db: Session, pinned: Category | None = None) -> None:
    """Give every category its own nav slot.

    A position that is already taken pushes that category and everything after
    it down by one, so setting 3 on a category moves the old 3 to 4, 4 to 5, ...
    ``pinned`` (the category just saved) wins its slot; otherwise the newer
    category wins a tie.
    """
    categories = db.query(Category).all()
    categories.sort(key=lambda c: (c.position, c is not pinned, -(c.id or 0)))
    previous: int | None = None
    for category in categories:
        if previous is not None and category.position <= previous:
            category.position = previous + 1
        previous = category.position
