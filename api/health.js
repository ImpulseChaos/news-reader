module.exports = function handler(req, res) {
  const TOKEN = process.env.THENEWSAPI_TOKEN;
  res.status(200).json({ ok: true, tokenConfigured: Boolean(TOKEN) });
};
