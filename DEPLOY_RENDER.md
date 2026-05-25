# Deploy LMS on Render (Docker Blueprint)

This repo includes a [Render Blueprint](https://render.com/docs/blueprint-spec) (`render.yaml`) that deploys:

| Service   | Name      | Description              |
|-----------|-----------|--------------------------|
| Web (API) | `lms-api` | Express backend (Docker) |
| Web (UI)  | `lms-web` | Next.js frontend (Docker) |

MongoDB stays on **MongoDB Atlas** (or any hosted MongoDB). Render does not host the database in this blueprint.

## Prerequisites

1. Git repo (GitHub/GitLab) with this project pushed
2. MongoDB Atlas cluster with a database user and connection string
3. Atlas **Network Access** → allow `0.0.0.0/0` (required for Render’s outbound IPs)

Use a URI that includes the database name, for example:

```text
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/lms?retryWrites=true&w=majority
```

## Deploy steps

1. Open [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
2. Connect your repository
3. Confirm `render.yaml` at the repo root
4. When prompted, set **`MONGODB_URI`** (marked `sync: false` in the blueprint)
5. Click **Apply** and wait for both services to build and deploy

Render will:

- Build each service from its `Dockerfile`
- Set `NEXT_PUBLIC_API_URL` on the frontend from the API’s public URL
- Set `CLIENT_URL` on the API from the frontend’s public URL (CORS)
- Generate `JWT_SECRET` automatically

## After deploy

1. Open the **`lms-web`** URL (e.g. `https://lms-web-xxxx.onrender.com`)
2. Sign in with seeded accounts (password `Password123`):
   - `borrower@lms.test`, `admin@lms.test`, etc.

If login fails, open the **`lms-api`** service → **Shell** and run:

```bash
node dist/seed.js
```

## First deploy / CORS note

`CLIENT_URL` and `NEXT_PUBLIC_API_URL` reference each other’s `RENDER_EXTERNAL_URL`. If the first deploy shows CORS or API errors, trigger **Manual Deploy** on both services once (or redeploy the Blueprint) so env vars resolve.

## Environment variables

| Variable | Service | Set by |
|----------|---------|--------|
| `MONGODB_URI` | lms-api | You (Blueprint prompt) |
| `JWT_SECRET` | lms-api | Auto-generated |
| `CLIENT_URL` | lms-api | From `lms-web` URL |
| `NEXT_PUBLIC_API_URL` | lms-web (build) | From `lms-api` URL |

## File uploads

Salary slips are stored on the container filesystem (`backend/uploads`). On Render’s free tier this storage is **ephemeral** (lost on redeploy). For persistent files, add a [Render Disk](https://render.com/docs/disks) on a paid plan and mount it to `/app/uploads`.

## Local Docker test

```bash
# API
cd backend
docker build -t lms-api .
docker run --rm -p 5000:5000 -e MONGODB_URI="your-uri" -e JWT_SECRET="test" -e CLIENT_URL="http://localhost:3000" lms-api

# Web (set API URL at build time)
cd frontend
docker build -t lms-web --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 .
docker run --rm -p 3000:3000 lms-web
```

## Upgrade plans

Free web services spin down after inactivity. Upgrade to a paid plan in the Render dashboard for always-on instances.
