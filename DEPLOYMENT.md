# Deploying to cPanel with automatic GitHub deployments

End state: you push to `main`, GitHub builds the site and ships it to your cPanel
account, and both apps restart on their own.

Your account runs two cPanel apps:

| App | cPanel tool | What it runs | Suggested URL |
|---|---|---|---|
| API | Setup **Python** App | FastAPI (admin, articles, wire) | `api.yourdomain.com` |
| Site | Setup **Node.js** App | Next.js (the public site) | `yourdomain.com` |

Work through the steps in order. Steps 1–6 are one-time setup; after that every
push deploys itself.

---

## Step 1 — Create the MySQL database

cPanel → **MySQL® Databases**

1. Under *Create New Database*, name it `dailyuswire`. cPanel prefixes it with your
   account name, so the real name becomes something like `youruser_dailyuswire`.
2. Under *Add New User*, create a user and a strong password. Save the password now —
   cPanel will not show it again.
3. Under *Add User To Database*, add the user to the database and tick **ALL PRIVILEGES**.

Write down the full values, prefixes included:

```
DB name : youruser_dailyuswire
DB user : youruser_wireapp
DB pass : (what you just set)
DB host : localhost
```

> The app creates its own tables on first boot. Do not import any SQL.

---

## Step 2 — Create the subdomain for the API

cPanel → **Domains** → *Create A Domain*

- Domain: `api.yourdomain.com`
- Document root: leave whatever cPanel suggests.

Then cPanel → **SSL/TLS Status**, tick both `yourdomain.com` and `api.yourdomain.com`
and click *Run AutoSSL*. Wait for both to show a valid certificate before continuing —
the site calls the API over HTTPS, and a browser will block it otherwise.

---

## Step 3 — Create the Python app (the API)

cPanel → **Setup Python App** → *Create Application*

| Field | Value |
|---|---|
| Python version | 3.11 or newer |
| Application root | `apps/api` |
| Application URL | `api.yourdomain.com` |
| Application startup file | `passenger_wsgi.py` |
| Application Entry point | `application` |

Click **Create**, then scroll to **Environment variables** and add these. Click
*Add Variable* for each, then **Save**:

| Name | Value |
|---|---|
| `DATABASE_URL` | `mysql://youruser_wireapp:PASSWORD@localhost/youruser_dailyuswire` |
| `SECRET_KEY` | a long random string — run `openssl rand -hex 32` |
| `SITE_URL` | `https://yourdomain.com` |
| `API_URL` | `https://api.yourdomain.com` |
| `CORS_ORIGINS` | `https://yourdomain.com` |
| `ADMIN_EMAIL` | your login email |
| `ADMIN_PASSWORD` | your admin password — **change it from the default** |
| `ADMIN_NAME` | your name |
| `MEDIA_DIR` | `/home/youruser/apps/api/media` |
| `REVALIDATE_URL` | `https://yourdomain.com/api/revalidate` |
| `REVALIDATE_SECRET` | another `openssl rand -hex 32` value |

If your password contains `@`, `:`, `/` or `#`, URL-encode it in `DATABASE_URL`
(`@` → `%40`, `#` → `%23`) or the connection string will not parse.

At the top of the page, copy the **"Enter to the virtual environment"** command.
It looks like:

```
source /home/youruser/virtualenv/apps/api/3.11/bin/activate && cd /home/youruser/apps/api
```

You need the path up to `activate` in Step 5. Save it.

---

## Step 4 — Create the Node.js app (the site)

cPanel → **Setup Node.js App** → *Create Application*

| Field | Value |
|---|---|
| Node.js version | 20 or newer |
| Application mode | Production |
| Application root | `apps/web` |
| Application URL | `yourdomain.com` |
| Application startup file | `app.js` |

Click **Create**, then add these environment variables and **Save**:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `API_INTERNAL_URL` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `REVALIDATE_SECRET` | **the same value** you used in Step 3 |

`API_INTERNAL_URL` is how the site reaches the API when rendering pages on the
server. Set it only after AutoSSL from Step 2 has finished, or the first requests
will fail certificate validation.

---

## Step 5 — Add the GitHub secrets and variables

GitHub → your repo → **Settings** → **Secrets and variables** → **Actions**

### Secrets tab → *New repository secret*

| Secret | Value |
|---|---|
| `CPANEL_HOST` | your **server** hostname, not your domain — see the note below |
| `CPANEL_USER` | your cPanel username |
| `CPANEL_SSH_KEY` | the **private** key from Step 6 (whole file, including the BEGIN/END lines) |
| `CPANEL_API_PATH` | `/home/youruser/apps/api` |
| `CPANEL_WEB_PATH` | `/home/youruser/apps/web` |
| `CPANEL_PY_ACTIVATE` | `/home/youruser/virtualenv/apps/api/3.11/bin/activate` (from Step 3) |

### Variables tab → *New repository variable*

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `API_INTERNAL_URL` | `https://api.yourdomain.com` (optional — defaults to the value above) |
| `CPANEL_SSH_PORT` | your SSH port — **not always 22**, see the table below |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | leave empty until AdSense approves you |
| `NEXT_PUBLIC_GA_ID` | your GA4 ID, or leave empty |
| `NEXT_PUBLIC_GSC_VERIFICATION` | your Search Console code, or leave empty |

> **Either tab works.** The workflow reads each of these from Variables first and
> falls back to Secrets, so if you already entered them as secrets the deploy
> still runs — no need to re-enter anything.
>
> Variables are the better home for them, for two reasons. These values are
> compiled into the public JavaScript bundle and are visible to anyone who views
> the site, so treating them as secrets protects nothing. And GitHub masks secret
> values in workflow logs, which turns your URLs into `***` and makes a failed
> deploy noticeably harder to read.
>
> The six entries in the Secrets table above are genuinely sensitive and belong
> in Secrets.

---

### Finding your host and port

Use the **server** hostname, not your domain. Your domain may point through
Cloudflare, may not have propagated yet, or may resolve differently from your
machine than from GitHub's runners — the server hostname always works.

Find it in cPanel: the sidebar shows *Shared IP Address*, and the **General
Information** panel shows the server name. A reverse lookup also reveals it:

```bash
dig +short yourdomain.com          # -> 162.0.235.120
dig +short -x 162.0.235.120        # -> premium147-2.web-hosting.com
```

SSH ports differ by provider, and using the wrong one looks exactly like a
firewall block:

| Provider | Server hostname looks like | SSH port |
|---|---|---|
| Namecheap | `premium123.web-hosting.com` | **21098** |
| Hostinger | `srv123.hostinger.com` | **65002** |
| A2 / InMotion / most others | varies | `7822` or `22` |

The authoritative answer is in cPanel → **SSH Access** → *Manage SSH Keys*, which
displays the port your account uses. On shared plans SSH is sometimes disabled by
default — Namecheap, for example, requires you to enable it from your account
dashboard before it will accept connections.

---

## Step 6 — Give GitHub SSH access

**On your own computer**, generate a key pair dedicated to deployments:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/cpanel_deploy -N ""
```

That writes two files:
- `~/.ssh/cpanel_deploy` — **private**. Goes into the `CPANEL_SSH_KEY` GitHub secret.
- `~/.ssh/cpanel_deploy.pub` — **public**. Goes onto the server.

Install the public key. The quickest route, if password login works, is:

```bash
ssh-copy-id -i ~/.ssh/cpanel_deploy.pub -p YOUR_PORT youruser@your-server-hostname
```

Or through the UI: cPanel → **SSH Access** → *Manage SSH Keys* → *Import Key*.
Paste the contents of the `.pub` file (`cat ~/.ssh/cpanel_deploy.pub`), leave the
passphrase blank, save — then click **Manage** → **Authorize**.

> **Authorize is a separate step and the one people miss.** An imported but
> unauthorized key is ignored, and the server quietly falls back to asking for a
> password.

Confirm it works before relying on it (use your SSH port):

```bash
ssh -i ~/.ssh/cpanel_deploy -p YOUR_PORT youruser@your-server-hostname "echo connected"
```

For example, on Namecheap:

```bash
ssh -i ~/.ssh/cpanel_deploy -p 21098 youruser@premium147.web-hosting.com "echo connected"
```

If that prints `connected`, you are ready. If it asks for a password, the key was
not authorized — repeat the Import/Authorize step.

> Never paste the private key anywhere except the GitHub secret. If it leaks,
> delete it in *Manage SSH Keys* and generate a new pair.

---

## Step 7 — Deploy

Merge your work into `main` and push:

```bash
git checkout main
git merge claude/wonderful-edison-e322ew
git push origin main
```

Watch it run under the repo's **Actions** tab. The workflow:

1. builds the Next.js site on GitHub's runner (not on your server — a shared
   cPanel account will usually get the build killed for exceeding CPU or memory),
2. rsyncs the built site to `apps/web` and the API to `apps/api`,
3. installs the Python dependencies into your cPanel virtualenv,
4. restarts both apps by touching `tmp/restart.txt`,
5. checks `https://api.yourdomain.com/health` and the homepage, and fails loudly
   if either is down.

From now on, **every push to `main` deploys automatically.** You can also trigger
one by hand from Actions → *Deploy to cPanel* → *Run workflow*.

---

## Step 8 — First-run checks

1. Visit `https://api.yourdomain.com/health` → `{"status":"ok","site":"Daily US Wire"}`
2. Visit `https://yourdomain.com` → the site loads
3. Sign in at `https://yourdomain.com/admin` with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`
4. Go to **News Wire** → **Pull latest** → headlines appear
5. Upload an image in **Media** to confirm the `media` folder is writable

Then **change your admin password** under Team, and delete or rewrite the eight
starter articles.

---

## Troubleshooting

**"We're sorry, but something went wrong" on the API**
Passenger is hiding the real error. cPanel → Setup Python App → open the app →
the log path is listed there, or check `~/logs/`. Most common cause: a bad
`DATABASE_URL` (unencoded password character, or the `youruser_` prefix missing).

**The site loads but every page is empty**
The site cannot reach the API. Check `API_INTERNAL_URL` in the Node app's
environment variables, and confirm `https://api.yourdomain.com/health` responds.

**Images return 404**
Two possible causes. First, `MEDIA_DIR` must be an absolute path that exists and
is writable — the deploy creates `apps/api/media` for you. Second, the `/media`
proxy target is frozen into the build, so `NEXT_PUBLIC_API_URL` must have been
correct **in GitHub Actions**, not just on the server. If you changed that
variable, re-run the deploy; editing it in cPanel alone will not help. A build
that would hit this now fails on purpose with a message naming both URLs.

**The build succeeds but the site does not change**
Passenger caches workers. Restart both apps from their cPanel pages, or push an
empty commit to re-run the deploy.

**Deploy fails at "Configure SSH"**
Wrong host, wrong port, or the key was not authorized. Re-run the `ssh -i ...`
test from Step 6 — the workflow can only do what that command can do.

**`ssh: Could not resolve hostname`**
DNS, not SSH — the connection never started. Check the name resolves at all with
`dig +short yourdomain.com`. If it resolves elsewhere but not on your machine,
your resolver is holding a stale negative cache; on macOS clear it with
`sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`. Using the server
hostname instead of the domain sidesteps this entirely.

**`Connection refused` or the connection hangs**
Almost always the wrong port — see the port table above — or SSH is not enabled
for the account yet. Confirm both in cPanel → SSH Access.

**SSH asks for a password instead of using the key**
The host and port are correct — the key just is not being accepted. Run the
connection verbosely to see which of three things is wrong:

```bash
ssh -v -i ~/.ssh/cpanel_deploy -p YOUR_PORT youruser@your-server-hostname 2>&1 \
  | grep -iE "offering|Authentications that can continue|denied"
```

| What you see | Cause | Fix |
|---|---|---|
| No `Offering public key` line | ssh is not using your key | `chmod 600 ~/.ssh/cpanel_deploy` |
| Offers the key, still prompts | Key imported but not authorized | cPanel → Manage SSH Keys → **Authorize** |
| `Authentications that can continue: password` only | Key auth disabled for the account | Enable SSH in your host's dashboard, not cPanel |

Confirm the server has the key you are actually using by comparing fingerprints:
`ssh-keygen -lf ~/.ssh/cpanel_deploy.pub` should match the entry cPanel lists.

**`pip install` fails on `cryptography`**
Some older cPanel images cannot build it. In the app's virtualenv, run
`pip install --only-binary :all: cryptography`, then re-deploy.

---

## A note on schema changes

The app creates any missing tables on boot, but it does not alter existing ones.
If a future change modifies a column, apply it to your live database yourself
(phpMyAdmin) or add an Alembic migration — `alembic` is already installed. This
only matters after you have real content; the first deploy builds everything
from scratch.

---

## Keeping the wire fresh automatically

cPanel → **Cron Jobs**, once an hour:

```
0 * * * * /usr/bin/curl -s -X POST "https://api.yourdomain.com/api/admin/feeds/fetch" -H "Authorization: Bearer YOUR_TOKEN" > /dev/null 2>&1
```

Get a token by signing in to `/admin` and copying `duw_token` from your browser's
local storage. Tokens expire after 12 hours, so for a permanent job it is better
to pull the wire manually from the admin panel — which is the sensible workflow
anyway, since every item needs rewriting before it is published.
