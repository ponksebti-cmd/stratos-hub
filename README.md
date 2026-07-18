# Stratos Hub — Real Estate AI Monorepo

Stratos Hub is an AI-powered co-pilot for real estate agencies, helping them manage listings, qualify leads, and automate client communication across multiple channels (Web, WhatsApp, Messenger, Instagram, TikTok).

## Project Structure

This is a monorepo containing:
- `/frontend`: React application built with TanStack Start, Vite, and Tailwind CSS.
- `/backend`: Bun-based HTTP server using `postgres.js` for database access and Google Gemini for AI.
- `package.json` (root): Orchestrates both frontend and backend development.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) (v1.2 or higher)
- [Node.js](https://nodejs.org) (v20 or higher)
- A PostgreSQL database (e.g., Supabase)

### Installation
1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Set up environment variables:
   - Copy `backend/.env.example` → `backend/.env`
   - Copy `frontend/.env.example` → `frontend/.env` (optional for local dev)

3. Run migrations:
   The backend auto-migrates the database on startup.

### Development
Start both frontend and backend in development mode:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Leave `VITE_API_BASE_URL` empty locally — Vite proxies API calls to the backend automatically.

### Deployment (split: Railway + Cloudflare Pages)

Production uses **two separate hosts** that must point at each other:

```
Browser  →  Cloudflare Pages (frontend UI)
                ↓  API calls (VITE_API_BASE_URL)
           Railway (backend API + Postgres)
```

| What | Host | Config file |
|------|------|-------------|
| **Backend API** | Railway | `backend/.env.example` → Railway Variables |
| **Frontend UI** | Cloudflare Pages | `frontend/.env.example` → Pages env vars |

#### Step 1 — Deploy backend on Railway

1. [railway.app](https://railway.app) → **New Project** → deploy from GitHub repo.
2. Set the service **Root Directory** to `backend` (or rely on `railway.json` at repo root).
3. Add **PostgreSQL** (Railway injects `DATABASE_URL`).
4. Add variables from `backend/.env.example`:
   - `JWT_SECRET`, `MASTER_SECRET`, `GEMINI_API_KEY`
   - `ALLOWED_ORIGINS` — your Cloudflare Pages URL (see step 2)
5. **Settings → Networking → Generate Domain** → copy the URL, e.g.  
   `https://stratos-hub-production.up.railway.app`
6. Confirm it works: open `https://YOUR-RAILWAY-URL/health` → should return `{"status":"ok",...}`

#### Step 2 — Deploy frontend on Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → connect GitHub repo.
2. Build settings:

   | Setting | Value |
   |---------|-------|
   | Root directory | `frontend` |
   | Build command | `npm ci && npm run build` |
   | Build output | `dist/client` |

3. **Environment variables (Production)**:
   - `VITE_API_BASE_URL` = your Railway URL from step 1 (no trailing slash)
4. Deploy → copy your Pages URL, e.g.  
   `https://stratos-hub.pages.dev`

#### Step 3 — Link them together

Go back to **Railway → Variables** and set:

```
ALLOWED_ORIGINS=https://stratos-hub.pages.dev,http://localhost:5173
```

(Railway redeploys automatically. The `localhost` entry lets you test split-deploy locally.)

#### Test checklist

| Test | Expected |
|------|----------|
| `https://YOUR-RAILWAY-URL/health` | JSON `{ "status": "ok" }` |
| Open Cloudflare Pages URL | Login/signup page loads |
| Sign up / log in on Pages | Works (no CORS errors in browser console) |
| Browser DevTools → Network | API calls go to Railway URL, not Pages URL |

#### Test split deploy locally (optional)

```bash
# Terminal 1 — backend
cd backend
ALLOWED_ORIGINS=http://localhost:5173 bun run dev

# Terminal 2 — frontend (simulates Cloudflare)
cd frontend
VITE_API_BASE_URL=http://localhost:3001 npm run dev
```

#### Google Sign-In (optional)

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), add:
- **Authorized JavaScript origins**: your Cloudflare Pages URL
- Set `GOOGLE_CLIENT_ID` on both Railway and Cloudflare (`VITE_GOOGLE_CLIENT_ID`)

## Core Features
- **AI Chat Widget**: Embeddable widget for agency websites.
- **Lead Management**: Automated lead capture and scoring.
- **Multilingual Support**: Built-in support for English and Arabic (RTL).
- **Omnichannel**: Integration with Meta (WhatsApp/FB/IG) and TikTok.
- **RAG (Retrieval Augmented Generation)**: Index and search uploaded property PDFs and CSVs.
