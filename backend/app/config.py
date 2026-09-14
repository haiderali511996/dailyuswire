from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # Core
    secret_key: str = "insecure-dev-key-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12
    database_url: str = f"sqlite:///{BASE_DIR / 'dailyuswire.db'}"

    # URLs
    site_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"
    cors_origins: str = "http://localhost:3000"

    # Bootstrap admin
    admin_email: str = "admin@dailyuswire.com"
    admin_password: str = "ChangeMe123!"
    admin_name: str = "Site Admin"

    # Uploads
    media_dir: str = str(BASE_DIR / "media")
    max_upload_mb: int = 10

    # ISR webhook
    revalidate_url: str = ""
    revalidate_secret: str = ""

    site_name: str = "Daily US Wire"
    site_tagline: str = "Breaking news, health, sports, entertainment, crypto, business, lifestyle and marketing."

    @property
    def sqlalchemy_url(self) -> str:
        """Normalise the DATABASE_URL into a driver SQLAlchemy understands.

        cPanel and most hosts hand out a bare `mysql://user:pass@host/db`;
        SQLAlchemy needs an explicit driver, and MySQL needs utf8mb4 or article
        text with emoji and smart quotes is silently mangled.
        """
        url = self.database_url.strip()
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("mysql+pymysql://") and "charset=" not in url:
            url += ("&" if "?" in url else "?") + "charset=utf8mb4"
        return url

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def media_path(self) -> Path:
        p = Path(self.media_dir)
        if not p.is_absolute():
            p = BASE_DIR / p
        p.mkdir(parents=True, exist_ok=True)
        return p


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
