const UPSTREAM = "https://api.thenewsapi.com/v1/news/all";

module.exports = async function handler(req, res) {
  const TOKEN = process.env.THENEWSAPI_TOKEN;

  if (!TOKEN) {
    return res.status(500).json({ error: "Server misconfiguration: token not set." });
  }

  const allowed = ["page", "categories", "search"];
  const params = new URLSearchParams({ language: "en", limit: "3" });

  for (const key of allowed) {
    if (req.query[key] !== undefined) {
      params.set(key, req.query[key]);
    }
  }

  const url = `${UPSTREAM}?${params.toString()}`;

  try {
    const upstream = await fetch(`${url}&api_token=${TOKEN}`);
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ error: "Upstream request failed." });
  }
};
