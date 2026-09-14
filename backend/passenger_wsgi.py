"""Passenger entry point for cPanel's "Setup Python App".

cPanel runs Python apps under Phusion Passenger, which speaks WSGI. FastAPI is
an ASGI app, so it is wrapped with a2wsgi here.

In cPanel > Setup Python App, set:
    Application startup file : passenger_wsgi.py
    Application Entry point  : application

Passenger does not run ASGI lifespan events, so first-run setup (create tables,
seed the eight categories, create the admin user) is called explicitly below
instead of relying on the FastAPI lifespan handler.
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Passenger does not always start with the app directory on sys.path.
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env before anything imports Settings.
os.environ.setdefault("PYTHONUNBUFFERED", "1")

from a2wsgi import ASGIMiddleware  # noqa: E402

from app import bootstrap  # noqa: E402
from app.main import app as asgi_app  # noqa: E402

# Runs on every worker boot. Each step is idempotent - existing tables, the
# admin account and the category rows are left untouched.
bootstrap.run()

application = ASGIMiddleware(asgi_app)
