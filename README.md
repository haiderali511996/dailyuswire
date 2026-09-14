# Daily US Wire

A complete, AdSense-ready news publishing platform: a **Python/FastAPI** backend with a full
admin panel, and a **Next.js 16** front end covering eight sections — News, Health, Sports,
Entertainment, Crypto, Business, Lifestyle and Marketing.

![Sections](https://img.shields.io/badge/sections-8-03305f) ![Backend](https://img.shields.io/badge/backend-FastAPI-009688) ![Frontend](https://img.shields.io/badge/frontend-Next.js%2016-000000)

---

## What's in the box

**Public site**
- Newspaper-style homepage: hero lead, latest rail, per-section blocks, breaking-news ticker
- Category, article, author, tag and search pages, all server-rendered
- Article pages with breadcrumbs, table of contents, reading progress, image gallery, share bar and related stories
- Fully responsive down to 360px; light theme locked, no layout shift
- Legal pages AdSense requires: About, Contact, Privacy Policy, Terms, Disclaimer, Editorial Policy

**Admin panel** (`/admin`)
- Dashboard with per-section counts, view totals and pending wire items
- Article editor with **TinyMCE** (self-hosted, no API key), category selection, tags, scheduling
- **Live SEO panel**: score out of 100, Google SERP preview, and a Yoast-style checklist
- 3–5 images per article with per-image alt text, caption and credit
- Media library: drag-and-drop upload, auto-conversion to WebP, resize + thumbnail
- **News Wire**: pulls headlines from 18 public RSS feeds and turns them into drafts
- Categories, team management with roles, and site settings

**SEO**
- `sitemap.xml`, Google News `news-sitemap.xml`, `robots.txt`, RSS per site and per category
- Per-article meta title/description/keywords, canonical URL, noindex toggle
- JSON-LD: `NewsArticle`, `BreadcrumbList`, `NewsMediaOrganization`, `WebSite` + Sitelinks Search
- Full Open Graph and Twitter card tags, timezone-aware publish/modify dates
- ISR with on-publish webhook revalidation — pages update instantly, stay static

---

## Quick start

Two terminals. Backend first.

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, REVALIDATE_SECRET

uvicorn app.main:app --reload --port 8000
```

First run creates the database, the eight categories, your admin account and the RSS
source list. API docs: <http://localhost:8000/docs>

### 2. Frontend

```bash
cd frontend
npm install                 # also self-hosts TinyMCE into public/tinymce

cp .env.example .env.local
# Set NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL and a REVALIDATE_SECRET matching the backend

npm run dev
```

Site: <http://localhost:3000> · Newsroom: <http://localhost:3000/admin>

### 3. Fill the site

```bash
cd backend
python seed_demo.py --covers ./covers    # 8 starter articles, one per section
```

Then sign in to `/admin/wire`, click **Pull latest**, select headlines and **Import as drafts**.

---

## Docker

```bash
cp .env.example .env    # set SECRET_KEY, ADMIN_PASSWORD, REVALIDATE_SECRET, SITE_URL
docker compose up -d --build
```

Brings up Postgres, the API and the front end together.

---

## How the news wire works — read this before publishing

The wire pulls **only what publishers put in their own syndication feeds**: headline, short
summary, link and image. Importing an item creates a **draft** carrying a "rewrite required"
banner and a credited link back to the source. **Nothing from a feed is ever auto-published.**

This is deliberate, and it is not optional if you want AdSense:

- Republishing another outlet's article text is copyright infringement.
- "Scraped content" and "copied content" are explicit **Google AdSense policy violations** and
  are among the most common reasons applications are rejected.
- Google's helpful-content signals demote sites that add nothing beyond what is already indexed.

**Use the wire as a story-spotting tool.** Rewrite each draft in your own words, add your own
reporting, analysis or context, delete the banner, then publish. That is what makes the page
original — and what makes the site monetisable.

Add or remove feeds under **News Wire → Manage sources**. Only add feeds a publisher offers
openly for syndication, and always keep the source link.

---

## Going live

### Before you apply to AdSense

1. **Publish 25–30 original articles** spread across your sections. Eight starter posts is not
   enough for approval — that is a starting scaffold, not an application.
2. **Replace the placeholder cover images.** The generated gradients are fillers; use licensed
   photography or your own.
3. **Fill in the real details** in About and Contact — a real business address and a working
   email. AdSense reviewers check these.
4. **Write real author bios** under Team. Named authors with checkable expertise carry real
   weight in both AdSense review and Google's E-E-A-T signals.
5. **Verify in Search Console** and submit both sitemaps.

### Environment variables to set in production

| Variable | Where | Purpose |
|---|---|---|
| `SECRET_KEY` | backend | JWT signing. Must be long and random. |
| `DATABASE_URL` | backend | MySQL or Postgres in production; SQLite is dev-only. |
| `ADMIN_PASSWORD` | backend | Change it from the default before first boot. |
| `SITE_URL` | both | Public URL; drives canonicals, sitemaps and JSON-LD. |
| `REVALIDATE_SECRET` | both | Must match on both sides or ISR will not refresh. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | frontend | `ca-pub-…`. Ad slots render nothing until this is set. |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | frontend | Slot IDs for header, in-article, sidebar, footer. |
| `NEXT_PUBLIC_GA_ID` | frontend | GA4 `G-…`. |
| `NEXT_PUBLIC_GSC_VERIFICATION` | frontend | Search Console HTML-tag verification. |

Ad slots and analytics stay completely inert while their variables are blank, so the site is
clean while your application is pending.

### Media storage

Uploads land in `backend/media` and are served through the front end at `/media/*` via a Next
rewrite — same origin, so they are optimised by `next/image` and cacheable by your CDN. On a
platform with an ephemeral filesystem, mount a persistent volume there or move `app/utils/images.py`
to S3 or R2.

---

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, gzip, static media
    config.py          Settings from .env
    models.py          Users, categories, posts, images, media, feeds, settings
    schemas.py         Pydantic v2 request/response models
    bootstrap.py       First-run: tables, 8 categories, admin user, feed list
    deps.py            JWT auth + role guards (admin / editor / author)
    routers/           auth · public · admin_posts · admin_misc · admin_feeds · feeds_public
    services/          posts.py (write path, ISR webhook) · ingest.py (RSS)
    utils/             security · text (sanitise, slugs, SEO score) · images · seo (JSON-LD)
  seed_demo.py         Starter articles
frontend/
  app/
    (site)/            Public pages, wrapped in header/footer
    admin/(panel)/     Newsroom, auth-guarded
    admin/(auth)/      Login, outside the guard
    sitemap.ts · robots.ts · news-sitemap.xml/ · rss/ · api/revalidate/
  components/site/     Header, cards, sidebar, ads, schema, breadcrumbs, gallery…
  components/admin/    Editor, SEO panel, media picker, image set, shell, toasts
  lib/                 api (server) · admin-api (client) · auth-context · config · types
```

## Security notes

- Passwords are bcrypt-hashed; sessions are JWTs with a 12-hour expiry.
- All editor HTML is sanitised server-side with `bleach` before storage — scripts, event
  handlers and unsafe CSS are stripped, so the rich text editor cannot introduce XSS.
- Uploads are verified as real images by Pillow, stripped of EXIF, and re-encoded to WebP.
- Role guards are enforced on the API, not just hidden in the UI. Authors can only edit
  their own posts.
- `/admin` is `noindex, nofollow` and disallowed in `robots.txt`.

## Licence

Your project — use it as you like. TinyMCE is bundled under its GPL licence
(`licenseKey: 'gpl'`); if you need the commercial terms, get a key from Tiny.

---

## Deploying

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for step-by-step cPanel setup with
automatic GitHub deployments on every push to `main`.

Supported databases: MySQL/MariaDB (`mysql://…`), PostgreSQL (`postgresql://…`)
and SQLite (development default).
