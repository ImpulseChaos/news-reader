# news-reader — Express Proxy

Proxies requests to TheNewsApi so the browser never sees the API token.

## Setup

```bash
cp .env.example .env
# Edit .env and set THENEWSAPI_TOKEN
npm install
npm run dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Liveness check; confirms token is configured |
| GET | /api/news/all | Proxy to TheNewsApi /v1/news/all |

### /api/news/all query params

| Param | Notes |
|-------|-------|
| page | Page number (default 1) |
| categories | Comma-separated; omit when using search |
| search | Keyword; omit when using categories |

`language=en` and `limit=3` are always set by the server; the token is appended server-side and never forwarded to the client.
