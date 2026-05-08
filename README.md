# NewsReader

A Flipboard-style news reader built with React + Vite (frontend) and an Express proxy (backend). Browse articles by category or keyword, save favorites, and navigate with a circular paginator — all without exposing your API token to the browser.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3b82f6?style=flat-square) ![React](https://img.shields.io/badge/React-18-3b82f6?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-5.x-3b82f6?style=flat-square) ![Express](https://img.shields.io/badge/Express-4.x-3b82f6?style=flat-square)

---

## Features

- **Single-article featured view** — one large card at a time with image, title, description, and source
- **Category filters** — tech, general, science, sports, business, health, entertainment, politics, food, travel
- **Keyword search** — switches from category mode automatically
- **Circular paginator** — prev/next with absolute article numbers; jumps directly to any article
- **Prefetching** — next and previous pages load in the background so navigation feels instant
- **In-memory caching** — revisiting a page never makes a duplicate request
- **Favorites** — save articles to localStorage and browse them in a dedicated view
- **Responsive** — full sidebar on desktop; collapsible filters on mobile with the article filling the screen
- **Secure** — API token lives only on the Express proxy, never in the browser

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Node.js, Express |
| Styles | Plain CSS (no framework) |
| Data | [TheNewsApi](https://www.thenewsapi.com/) |

---

## Project Structure

```
news-reader/
├── package.json          # Root scripts — runs both servers
├── server/
│   ├── server.js         # Express proxy (port 5177)
│   ├── package.json
│   ├── .env              # Your token goes here (gitignored)
│   └── .env.example      # Safe to commit — no real secrets
└── web/
    ├── vite.config.ts    # Proxies /api/* → localhost:5177
    ├── src/
    │   ├── App.tsx           # All state, filtering, pagination, favorites
    │   ├── styles.css
    │   ├── lib/newsapi.ts    # Typed fetch + error handling
    │   └── components/
    │       └── HeadlinesList.tsx  # Featured card + pager
    └── public/
        ├── favicon.svg
        └── placeholder.svg
```

---

## Getting Started

### 1. Get an API token

Sign up for a free token at [thenewsapi.com](https://www.thenewsapi.com/).

### 2. Install dependencies

```bash
npm run server:install
cd web && npm install && cd ..
```

### 3. Add your token

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
THENEWSAPI_TOKEN=your_token_here
PORT=5177
```

### 4. Start both servers

```bash
npm run dev
```

| Server | URL |
|--------|-----|
| App | http://localhost:5176 |
| Proxy | http://localhost:5177 |

To verify the proxy is running: http://localhost:5177/api/health

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers in parallel |
| `npm run server:dev` | Start the Express proxy only |
| `npm run web:dev` | Start the Vite dev server only |
| `npm run server:install` | Install server dependencies |

---

## Security

- `server/.env` is gitignored — never commit it
- The API token is appended server-side and never forwarded to the client
- The proxy only accepts requests from `http://localhost:5176`
