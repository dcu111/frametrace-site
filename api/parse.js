// AI-Parser: czyta dokument (PDF/JPG/PNG) przez Claude i zwraca ustrukturyzowane pola paszportu.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name","model","gtin","serial","manufacturer","country","www","components","co2","co2Method","recycledPct","durability","certificates","battery"],
  properties: {
    name: { type: "string" },
    model: { type: "string" },
    gtin: { type: "string" },
    serial: { type: "string" },
    manufacturer: { type: "string" },
    country: { type: "string" },
    www: { type: "string" },
    components: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["component","material","sharePct","origin","recycledPct"],
        properties: {
          component: { type: "string" }, material: { type: "string" },
          sharePct: { type: "string" }, origin: { type: "string" }, recycledPct: { type: "string" }
        }
      }
    },
    co2: { type: "string" },
    co2Method: { type: "string" },
    recycledPct: { type: "string" },
    durability: { type: "string" },
    certificates: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        required: ["name","number","url"],
        properties: { name: { type: "string" }, number: { type: "string" }, url: { type: "string" } }
      }
    },
    battery: {
      type: "object", additionalProperties: false,
      required: ["chemistry","capacityKWh","co2Class","sohPct","ddUrl"],
      properties: {
        chemistry: { type: "string" }, capacityKWh: { type: "string" }, co2Class: { type: "string" },
        sohPct: { type: "string" }, ddUrl: { type: "string" }
      }
    }
  }
};

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
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI-Parser nieaktywny: dodaj ANTHROPIC_API_KEY w Vercel (Settings → Environment Variables) i zrób redeploy." });
  }

  const { media_type, data } = req.body || {};
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!media_type || !data || !allowed.includes(media_type)) {
    return res.status(400).json({ error: "Prześlij PDF albo obraz (JPG/PNG/WebP)" });
  }

  const block = media_type === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type, data } }
    : { type: "image", source: { type: "base64", media_type, data } };

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 4000,
        messages: [{ role: "user", content: [block, { type: "text", text: PROMPT }] }],
        output_config: { format: { type: "json_schema", schema: SCHEMA } },
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || ("Claude API: HTTP " + r.status) });
    if (j.stop_reason === "refusal") return res.status(502).json({ error: "Model odmówił analizy tego dokumentu" });
    const text = (j.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const fields = JSON.parse(text);
    return res.status(200).json({ ok: true, fields, usage: j.usage });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
