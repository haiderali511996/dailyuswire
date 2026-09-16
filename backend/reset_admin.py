"""List newsroom accounts and reset a password.

ADMIN_PASSWORD in the environment only applies when the admin user is first
created - bootstrap leaves an existing account alone, so changing that variable
later has no effect. This is the supported way to change it afterwards.

    python reset_admin.py --list
    python reset_admin.py --email you@example.com --password 'NewPassword123'

DATABASE_URL must point at the live database. cPanel's environment variables
only reach the Passenger process, so export it first when running over SSH:

    export DATABASE_URL='mysql://user:pass@localhost/dbname'
"""

from __future__ import annotations

import argparse
import sys

from app.database import SessionLocal
from app.models import Role, User
from app.utils.security import hash_password
from app.utils.text import slugify, unique_slug

MIN_LENGTH = 8


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset a newsroom password.")
    parser.add_argument("--list", action="store_true", help="List accounts and exit")
    parser.add_argument("--email", help="Account to reset")
    parser.add_argument("--password", help="New password (at least 8 characters)")
    parser.add_argument(
        "--create",
        action="store_true",
        help="Create the account as an admin if the email is not found",
    )
    args = parser.parse_args()

    with SessionLocal() as db:
        users = db.query(User).order_by(User.id).all()

        if args.list or not args.email:
            if not users:
                print("No accounts exist yet. Start the API once so bootstrap creates one,")
                print("or re-run with --email and --create.")
            else:
                print(f"{len(users)} account(s):\n")
                print(f"  {'id':>3}  {'email':<38} {'role':<8} active")
                for u in users:
                    print(f"  {u.id:>3}  {u.email:<38} {u.role.value:<8} {u.is_active}")
            if not args.email:
                print("\nTo reset:  python reset_admin.py --email EMAIL --password 'NEW'")
            return 0

        if not args.password:
            print("error: --password is required with --email", file=sys.stderr)
            return 2
        if len(args.password) < MIN_LENGTH:
            print(f"error: password must be at least {MIN_LENGTH} characters", file=sys.stderr)
            return 2

        email = args.email.lower().strip()
        user = db.query(User).filter(User.email == email).one_or_none()

        if user is None:
            if not args.create:
                print(f"error: no account with email {email}", file=sys.stderr)
                print("Existing accounts:", ", ".join(u.email for u in users) or "(none)", file=sys.stderr)
                print("Re-run with --create to make this one.", file=sys.stderr)
                return 1
            name = email.split("@")[0].replace(".", " ").title()
            user = User(
                email=email,
                name=name,
                slug=unique_slug(db, User, slugify(name)),
                hashed_password=hash_password(args.password),
                role=Role.admin,
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"Created admin account {email}")
            return 0

        user.hashed_password = hash_password(args.password)
        user.is_active = True
        db.commit()
        print(f"Password reset for {email} (role: {user.role.value})")
        print("Sign in at /admin with the new password.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
