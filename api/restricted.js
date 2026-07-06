// Warstwa o ograniczonym dostępie: zwraca dane po podaniu kodu dostępu (serwis / recykler / organ nadzoru).
const RESTRICTED_REPO = "dcu111/frametrace-restricted";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { id, code } = req.query || {};
  if (!id || !code) return res.status(400).json({ error: "Brak identyfikatora lub kodu dostępu" });
  if (!process.env.GITHUB_TOKEN) return res.status(503).json({ error: "Usługa nieaktywna" });

  const safe = String(id).replace(/[^A-Za-z0-9_-]/g, "-");
  const r = await fetch(`https://api.github.com/repos/${RESTRICTED_REPO}/contents/restricted/${safe}.json`, {
    headers: {
      "Authorization": "Bearer " + process.env.GITHUB_TOKEN,
      "Accept": "application/vnd.github.raw+json",
      "User-Agent": "frametrace-dpp",
    },
  });
  if (!r.ok) return res.status(404).json({ error: "Ten paszport nie ma danych o ograniczonym dostępie" });

  let doc;
  try { doc = JSON.parse(await r.text()); } catch (e) { return res.status(500).json({ error: "Uszkodzony rekord" }); }

  if (String(code).trim().toUpperCase() !== String(doc.code || "").toUpperCase()) {
    return res.status(403).json({ error: "Nieprawidłowy kod dostępu" });
  }
  return res.status(200).json({ ok: true, data: doc.data || {} });
};
