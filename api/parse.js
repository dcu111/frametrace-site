// AI-Parser: czyta dokument (PDF/JPG/PNG) przez Google Gemini i zwraca ustrukturyzowane pola paszportu.
const S = (props, required) => ({ type: "OBJECT", properties: props, required });
const STR = { type: "STRING" };
const SCHEMA = S({
  name: STR, model: STR, gtin: STR, serial: STR, manufacturer: STR, country: STR, www: STR,
  components: {
    type: "ARRAY",
    items: S({ component: STR, material: STR, sharePct: STR, origin: STR, recycledPct: STR },
      ["component","material","sharePct","origin","recycledPct"])
  },
  co2: STR, co2Method: STR, recycledPct: STR, durability: STR,
  certificates: {
    type: "ARRAY",
    items: S({ name: STR, number: STR, url: STR }, ["name","number","url"])
  },
  battery: S({ chemistry: STR, capacityKWh: STR, co2Class: STR, sohPct: STR, ddUrl: STR },
    ["chemistry","capacityKWh","co2Class","sohPct","ddUrl"])
}, ["name","model","gtin","serial","manufacturer","country","www","components","co2","co2Method","recycledPct","durability","certificates","battery"]);

const PROMPT = `Przeanalizuj załączony dokument (certyfikat, deklarację właściwości użytkowych, kartę produktu, specyfikację lub etykietę) i wyekstrahuj dane do Cyfrowego Paszportu Produktu.

Zasady:
- Wpisuj wyłącznie dane, które faktycznie są w dokumencie. Niczego nie zgaduj i nie wymyślaj.
- Pola, których nie ma w dokumencie, zostaw jako pusty string "" (a tablice jako []).
- Liczby podawaj jako tekst, bez jednostek (np. "12,4").
- "certificates": nazwa systemu certyfikacji (np. FSC, PEFC, CE, DoP, OEKO-TEX) i numer, jeśli widoczny.
- "components": komponenty/materiały z udziałem procentowym, jeśli podano.
- "battery" wypełniaj tylko dla dokumentów dotyczących baterii.`;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-admin-key");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Tylko POST" });

  if (!process.env.ADMIN_KEY || (req.headers["x-admin-key"] || "") !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Nieprawidłowy klucz operatora" });
  }
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) {
    return res.status(503).json({ error: "AI-Parser nieaktywny: dodaj GEMINI_API_KEY w Vercel (Settings → Environment Variables) i zrób redeploy." });
  }

  const { media_type, data } = req.body || {};
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!media_type || !data || !allowed.includes(media_type)) {
    return res.status(400).json({ error: "Prześlij PDF albo obraz (JPG/PNG/WebP)" });
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        method: "POST",
        headers: { "content-type": "application/json", "X-goog-api-key": KEY },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: media_type, data } },
            { text: PROMPT }
          ]}],
          generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA }
        })
      }
    );
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || ("Gemini API: HTTP " + r.status) });
    if (j.promptFeedback && j.promptFeedback.blockReason) {
      return res.status(502).json({ error: "Model odrzucił dokument: " + j.promptFeedback.blockReason });
    }
    const cand = (j.candidates || [])[0];
    const text = cand && cand.content && (cand.content.parts || []).map(p => p.text || "").join("");
    if (!text) return res.status(502).json({ error: "Pusta odpowiedź modelu" });
    const fields = JSON.parse(text);
    return res.status(200).json({ ok: true, fields, usage: j.usageMetadata });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
