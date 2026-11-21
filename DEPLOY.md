# Put OverlayLive online

OverlayLive is a **Next.js 16** app with a **PostgreSQL** database. To run it online you need two things:

1. a place to run the app (Node.js 20+), and
2. a PostgreSQL database, connected with the `DATABASE_URL` setting.

The tables are created by one command (`drizzle-kit push`), and the app fills in its starter data (Ava's profile, avatars, games, Breaking News, Top Lists boards) automatically the first time it opens.

---

## Step 0 — Put the code on GitHub (all options)

1. Download/export this project to your computer.
2. Create a new **private** repository on <https://github.com/new>.
3. In the project folder:

   ```bash
   git init
   git add .
   git commit -m "OverlayLive"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
   git push -u origin main
   ```

   `.gitignore` already keeps `node_modules`, `.next` and your `.env` (database password) out of GitHub.

---

## Option A — Railway (app + database in one place)

1. Sign in at <https://railway.app> with GitHub → **New Project** → **Deploy from GitHub repo** → pick your repo.
2. In the same project click **+ New** → **Database** → **PostgreSQL**.
3. Open your app service → **Variables** → **Add variable reference** → choose the Postgres `DATABASE_URL`.
4. App service → **Settings**:
   - **Build command:** `npm run build`
   - **Start command:** `npx drizzle-kit push --config=drizzle.prod.config.ts --force && npm run start -- -p $PORT`
5. **Settings → Networking → Generate Domain** (you get `https://your-app.up.railway.app`), or add your own domain.
6. Open `https://YOUR-DOMAIN/api/health` — it should show `{"ok":true}`. Then open `/dashboard`.

> Railway also detects the included `Dockerfile` automatically — that works too and already runs the table setup on start.

---

## Option B — Vercel + Neon (recommended)

The project is set up for Vercel: `vercel.json` runs `scripts/vercel-build.mjs`, which **checks the images, creates/updates the database tables and builds the app** in one go. No manual database step is needed.

1. **Push the project to GitHub with git** (Step 0). Don't upload through the GitHub website — it takes at most 100 files at a time and the artwork folders have more.
2. Go to <https://vercel.com/new> → **Import** your repository. Vercel detects Next.js and uses `vercel.json`; leave the build settings as they are.
3. **Add a database** — either:
   - in the Vercel project: **Storage → Create → Neon (Postgres)** → connect it to the project (this adds `DATABASE_URL` for you), or
   - create one at <https://neon.tech> and add it yourself: **Settings → Environment Variables → `DATABASE_URL`** = the connection string (ends in `?sslmode=require`), for Production and Preview.
4. Click **Deploy**. The build log shows:
   ```
   ▶ Checking images…        All images present and valid ✔
   ▶ Updating database tables…  [✓] Changes applied
   ▶ Building the app…       ✓ Compiled successfully
   ```
5. Open `https://your-app.vercel.app/api/health` → `{"ok":true}`, then `/dashboard`. The first visit fills in the starter data.
6. Add your own domain in **Settings → Domains**.

### Vercel tips

| Topic | What to know |
| --- | --- |
| **Deploy with Git, not the CLI** | `public/` is about 180 MB (leaderboard themes, frames, crowns). Vercel's Hobby plan caps **CLI uploads at 100 MB**; Git deployments don't have that cap. `.vercelignore` already leaves out `pictures/` (copies only). |
| **Function calls** | Every overlay polls the server. Hobby includes 1,000,000 function calls a month. On Vercel the app polls 1.5× slower by default; with many overlays open for long streams, add `NEXT_PUBLIC_POLL_SCALE=2` (or 3) in Environment Variables and redeploy. `1` = fastest. |
| **Region** | Put the Vercel functions near your database: **Settings → Functions → Region** (e.g. Washington `iad1` for Neon US East). |
| **Database connections** | The app uses a small connection pool on Vercel (5 per instance). Use Neon's **pooled** connection string (host contains `-pooler`) for the most headroom, or set `PG_POOL_MAX`. |
| **Schema changes** | Each deploy runs `drizzle-kit push --force`, which applies schema changes automatically — including dropping columns you removed. Back up first if you change `src/db/schema.ts`. Set `SKIP_DB_PUSH=1` to turn this off. |
| **Missing images** | If a deploy stops at "Some images are missing", the images didn't make it into the repository — push them with git. `SKIP_IMAGE_CHECK=1` builds anyway (not recommended). |
| **Variables** | Only `DATABASE_URL` is required (`POSTGRES_URL` from a Vercel/Neon integration also works). Optional: `NEXT_PUBLIC_POLL_SCALE`, `PG_POOL_MAX`, `NEXT_PUBLIC_QURAN_AUDIO_BASE`. |

---

## Option C — Your own server / VPS with Docker

On a server with Docker installed (Ubuntu, DigitalOcean, Hetzner…):

```bash
git clone https://github.com/YOUR-NAME/YOUR-REPO.git overlaylive
cd overlaylive

# 1. a database (skip if you already have one)
docker network create overlaylive
docker run -d --name ol-db --network overlaylive --restart unless-stopped \
  -e POSTGRES_PASSWORD=CHANGE_ME -e POSTGRES_DB=overlaylive \
  -v ol-data:/var/lib/postgresql/data postgres:16

# 2. the app (creates the tables on start)
docker build -t overlaylive .
docker run -d --name ol-app --network overlaylive --restart unless-stopped -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:CHANGE_ME@ol-db:5432/overlaylive" \
  overlaylive
```

Then point your domain at the server and put HTTPS in front of port 3000 — the simplest way is **Caddy**:

```
yourdomain.com {
  reverse_proxy localhost:3000
}
```

---

## After it is online

| What | URL |
| --- | --- |
| Dashboard | `https://yourdomain.com/dashboard` |
| Health check | `https://yourdomain.com/api/health` |
| Terms of Service | `https://yourdomain.com/terms` |
| Privacy Policy | `https://yourdomain.com/privacy` |
| TikTok verification file | `https://yourdomain.com/tiktokBQkJAUBQNUSWSJDpcEyBQC5JPCXAn0C9.txt` |
| Overlay links for OBS / LIVE Studio | `https://yourdomain.com/overlay/...` (copy them from the dashboard) |

**TikTok for Developers:** open the verification file URL above in a browser, check it shows
`tiktok-developers-site-verification=BQkJAUBQNUSWSJDpcEyBQC5JPCXAn0C9`, then click **Verify** in the portal and use the `/terms` and `/privacy` URLs.

---

## Before you go live — please read

- **The dashboard has no login yet.** Anyone who knows your URL can open `/dashboard` and change your settings. Keep the URL private, or add password protection before sharing it.
- **Real TikTok LIVE events are not connected yet.** Overlays currently run on Test Mode sample events and the test buttons. Showing your real gifts, likes and comments needs a TikTok LIVE event connector added to the server.
- Use HTTPS (all options above give it to you) — OBS and TikTok LIVE Studio load overlay links over the internet.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `/api/health` shows `{"ok":false}` | `DATABASE_URL` is wrong or the database isn't reachable. Managed databases usually need `?sslmode=require`. |
| Error `relation "streamer_profiles" does not exist` | The tables weren't created — run `npx drizzle-kit push --config=drizzle.prod.config.ts` with your `DATABASE_URL`. |
| `DATABASE_URL is not set` | Add the variable in your host's settings (or a `.env` file — copy `.env.example`). |
| Build fails on the host | Make sure it uses Node.js 20 or newer. |
