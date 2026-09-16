"""WSGI entry point for cPanel's "Setup Python App".

cPanel runs Python apps under Phusion Passenger, which speaks WSGI. FastAPI is
an ASGI app, so it is bridged with a2wsgi here.

In cPanel > Setup Python App, set:
    Application startup file : wsgi.py
    Application Entry point  : application

This file must NOT be called passenger_wsgi.py. cPanel generates its own
passenger_wsgi.py - overwriting anything already at that path - containing a
stub that loads the file named in "Application startup file". Naming that field
passenger_wsgi.py makes the stub load itself, and Passenger dies with
"RecursionError: maximum recursion depth exceeded".

Everything is built on the FIRST REQUEST rather than at import. Passenger
preloads the module and then forks its workers, and a2wsgi's bridge runs the
ASGI app on a background event-loop thread. Threads do not survive fork(), so a
bridge created at import time leaves every forked worker holding a dead loop and
every request hangs. Deferring construction means each worker builds its own
bridge after the fork.

Passenger also does not run ASGI lifespan events, so first-run setup (create
tables, seed the eight categories, create the admin user) is called explicitly
here instead of relying on the FastAPI lifespan handler.
"""

import os
import sys
import threading
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Passenger does not always start with the app directory on sys.path.
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("PYTHONUNBUFFERED", "1")

_bridge = None
_lock = threading.Lock()


def _build():
    """Create the ASGI->WSGI bridge and run first-boot setup, once per worker."""
    from a2wsgi import ASGIMiddleware

    from app import bootstrap
    from app.main import app as asgi_app

    # Idempotent: existing tables, categories and the admin user are left alone.
    bootstrap.run()
    return ASGIMiddleware(asgi_app)


def application(environ, start_response):
    global _bridge
    if _bridge is None:
        with _lock:
            if _bridge is None:
                _bridge = _build()
    return _bridge(environ, start_response)
