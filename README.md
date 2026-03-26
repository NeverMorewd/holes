# holes.dev — Personal Terminal

A personal blog and tools site built with React and Cloudflare Workers, themed after the Pip-Boy from Fallout.

## Features

- **Blog** — Markdown posts stored in Cloudflare D1, with tag filtering and pagination
- **Weather** — 7-day forecast for any city (via open-meteo.com, free)
- **Exchange Rate** — Currency conversion (via open.er-api.com, free)
- **Pip-Boy Theme** — Fluorescent green CRT aesthetic, fully responsive

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Deployment | Cloudflare (GitHub integration) |
| CI | GitHub Actions (type check + build) |

## API

All endpoints under `/api/v1/`. Response format:

```json
{ "success": true, "data": {}, "error": null, "meta": { "timestamp": "", "version": "1" } }
```

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/weather?city=Beijing` | 7-day weather forecast |
| GET | `/api/v1/exchange?from=CNY&to=USD&amount=100` | Currency exchange rate |
| GET | `/api/v1/posts` | List blog posts (`?page=1&tag=xxx`) |
| GET | `/api/v1/posts/:slug` | Get single post |
| POST | `/api/v1/posts` | Create post (requires `Authorization: Bearer <key>`) |
| PUT | `/api/v1/posts/:slug` | Update post (requires auth) |
| DELETE | `/api/v1/posts/:slug` | Delete post (requires auth) |

CORS is enabled on all API responses — safe to call from mobile or desktop clients.

## Local Development

```bash
# Install dependencies
npm install

# Copy and edit local secrets
cp .dev.vars.example .dev.vars

# Apply D1 migrations locally
npm run migrate:local

# Start Vite (port 5173) + Worker dev server (port 8787) concurrently
npm run dev
```

Vite proxies `/api/*` requests to the local Worker, so everything works on `http://localhost:5173`.

## Publishing Blog Posts

Write operations require an API key. Set the Worker secret once:

```bash
npx wrangler secret put ADMIN_API_KEY
```

Then POST to create a post:

```bash
curl -X POST https://your-worker.workers.dev/api/v1/posts \
  -H "Authorization: Bearer <your-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "slug": "my-first-post",
    "content": "# Hello\n\nMarkdown content here.",
    "summary": "A short summary.",
    "tags": ["blog", "hello"],
    "published": true
  }'
```

## Database Migrations

```bash
npm run migrate:local    # Apply to local D1
npm run migrate:remote   # Apply to production D1
```

## Project Structure

```
├── worker/              # Cloudflare Worker (API only)
│   ├── index.ts         # Router + CORS
│   ├── lib/response.ts  # JSON response helpers
│   └── api/
│       ├── weather.ts
│       ├── exchange.ts
│       └── posts.ts     # Blog CRUD
├── src/                 # React frontend
│   ├── components/
│   ├── pages/           # Home, Blog, BlogPost, Tools
│   ├── lib/api.ts       # Typed API client
│   └── styles/pipboy.css
├── migrations/          # D1 SQL migrations
└── .github/workflows/
    └── ci.yml           # Type check + build on every push
```
