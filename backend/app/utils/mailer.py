"""Send plain transactional mail (password resets).

Uses SMTP when SMTP_HOST is set; otherwise hands the message to the local
sendmail binary, which every cPanel server has, so it works with no setup.
"""

from __future__ import annotations

import shutil
import smtplib
import ssl
import subprocess
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from urllib.parse import urlparse

from app.config import settings

_SENDMAIL_PATHS = ("/usr/sbin/sendmail", "/usr/lib/sendmail")


def default_sender() -> str:
    if settings.mail_from:
        return settings.mail_from
    host = urlparse(settings.site_url).hostname or "localhost"
    if host.startswith("www."):
        host = host[4:]
    return formataddr((settings.site_name, f"no-reply@{host}"))


def send_mail(to: str, subject: str, text: str, html: str | None = None) -> None:
    """Send one message. Raises on failure so the caller can log it."""
    msg = EmailMessage()
    msg["From"] = default_sender()
    msg["To"] = to
    msg["Subject"] = subject
    msg["Message-ID"] = make_msgid()
    msg.set_content(text)
    if html:
        msg.add_alternative(html, subtype="html")

    if settings.smtp_host:
        _send_smtp(msg)
    else:
        _send_sendmail(msg)


def _send_smtp(msg: EmailMessage) -> None:
    context = ssl.create_default_context()
    if settings.smtp_port == 465:
        server: smtplib.SMTP = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20, context=context)
    else:
        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20)
    with server:
        if settings.smtp_port != 465:
            server.ehlo()
            if server.has_extn("starttls"):
                server.starttls(context=context)
                server.ehlo()
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def _send_sendmail(msg: EmailMessage) -> None:
    binary = shutil.which("sendmail") or next(
        (p for p in _SENDMAIL_PATHS if shutil.which(p)), None
    )
    if not binary:
        raise RuntimeError("No SMTP_HOST configured and no sendmail binary found")
    subprocess.run(
        [binary, "-t", "-i"], input=msg.as_bytes(), check=True, timeout=30, capture_output=True
    )
