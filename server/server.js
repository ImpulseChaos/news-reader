require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5177;
const TOKEN = process.env.THENEWSAPI_TOKEN;
const UPSTREAM = "https://api.thenewsapi.com/v1/news/all";

app.use(cors({ origin: "http://localhost:5176" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, tokenConfigured: Boolean(TOKEN) });
});

app.get("/api/news/all", async (req, res) => {
  if (!TOKEN) {
    return res.status(500).json({ error: "Server misconfiguration: token not set." });
  }

  const allowed = ["page", "categories", "search", "limit", "language"];
  const params = new URLSearchParams({ language: "en", limit: "3" });

  for (const key of allowed) {
    if (req.query[key] !== undefined) {
      params.set(key, req.query[key]);
    }
  }

  // Never log the token
  const url = `${UPSTREAM}?${params.toString()}`;
  console.log(`[proxy] GET ${url}`);

  try {
    const upstream = await fetch(`${url}&api_token=${TOKEN}`, {
      headers: { Accept: "application/json" },
    });

    const body = await upstream.json();

    res.status(upstream.status).json(body);
  } catch (err) {
    console.error("[proxy] fetch failed:", err.message);
    res.status(502).json({ error: "Upstream request failed." });
  }
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  if (!TOKEN) {
    console.warn("[server] WARNING: THENEWSAPI_TOKEN is not set in .env");
  }
});
