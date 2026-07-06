// Publikacja paszportu: zapisuje JSON do repo (część publiczna) i do repo prywatnego (warstwa ograniczona).
const PUBLIC_REPO = "dcu111/frametrace-site";
const RESTRICTED_REPO = "dcu111/frametrace-restricted";
const BASE = "https://frametrace-site.vercel.app";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-admin-key");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Tylko POST" });

  if (!process.env.ADMIN_KEY || (req.headers["x-admin-key"] || "") !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Nieprawidłowy klucz operatora" });
  }
  if (!process.env.GITHUB_TOKEN) {
    return res.status(503).json({ error: "Publikacja nieaktywna: brak GITHUB_TOKEN w ustawieniach Vercel" });
  }

  const { id, passport, restricted } = req.body || {};
  if (!id || !passport) return res.status(400).json({ error: "Brak id lub danych paszportu" });
  const safe = String(id).replace(/[^A-Za-z0-9_-]/g, "-");

  const gh = (url, opts = {}) =>
    fetch("https://api.github.com" + url, {
      ...opts,
      headers: {
        "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "frametrace-dpp",
        ...(opts.headers || {}),
      },
    });

  async function putFile(repo, path, obj, message) {
    const cur = await gh(`/repos/${repo}/contents/${path}`);
    const sha = cur.ok ? (await cur.json()).sha : undefined;
    const r = await gh(`/repos/${repo}/contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(obj, null, 2)).toString("base64"),
        ...(sha ? { sha } : {}),
      }),
    });
    if (!r.ok) throw new Error("GitHub " + r.status + ": " + (await r.text()).slice(0, 180));
    return sha ? "zaktualizowano" : "utworzono";
  }

  try {
    const action = await putFile(PUBLIC_REPO, `passports/${safe}.json`, passport, `DPP: ${safe} (${passport.name || ""})`);

    let accessCode = null;
    if (restricted && Object.keys(restricted).length) {
      accessCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      await putFile(RESTRICTED_REPO, `restricted/${safe}.json`, { code: accessCode, data: restricted }, `restricted: ${safe}`);
    }

    return res.status(200).json({ ok: true, action, id: safe, url: `${BASE}/p/${safe}`, accessCode });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
