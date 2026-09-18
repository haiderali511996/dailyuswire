from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app import bootstrap
from app.config import settings
from app.routers import (
    admin_misc,
    admin_posts,
    auth,
    feeds_public,
    public,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    bootstrap.run()
    yield


app = FastAPI(
    title=f"{settings.site_name} API",
    description="Headless news CMS: posts, categories, media and SEO.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(GZipMiddleware, minimum_size=800)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(settings.media_path)), name="media")

for router in (
    auth.router,
    public.router,
    admin_posts.router,
    admin_misc.router,
    feeds_public.router,
):
    app.include_router(router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok", "site": settings.site_name}
