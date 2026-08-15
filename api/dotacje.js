// Kwalifikator dotacyjny: opis firmy (tekst) -> ustrukturyzowane parametry do reguł.
// AI TYLKO rozumie opis. Kwoty, progi i kwalifikacja liczone są deterministycznie po stronie strony.
const STR = { type: "STRING" };
const SCHEMA = {
  type: "OBJECT",
  properties: {
    size: STR, industry: STR, voivodeship: STR,
    years5: STR, deminimis: STR, liquidity: STR, scale: STR,
    revenue: STR, profitable: STR, note: STR
  },
  required: ["size","industry","voivodeship","years5","deminimis","liquidity","scale","revenue","profitable","note"]
};

const PROMPT = `Przeanalizuj opis firmy napisany przez przedsiębiorcę i wypełnij pola kwalifikacji dotacyjnej.

Zwracaj WYŁĄCZNIE wartości z poniższych list. Jeśli czegoś nie da się ustalić z opisu — zwróć pusty string "".
Niczego nie zgaduj i nie domyślaj się na podstawie stereotypów.

- "size": wielkość firmy wg liczby pracowników. "mikro" (<10 osób), "mala" (10-49), "srednia" (50-249), "duza" (250+). Jeśli nie podano liczby osób ani wielkości — "".
- "industry": "meble" (produkcja mebli), "okna" (produkcja okien/drzwi/stolarki), "produkcja" (inna produkcja przemysłowa/wytwórstwo), "uslugi_prod" (usługi produkcyjne, np. obróbka, lakierowanie na zlecenie), "handel" (tylko handel/dystrybucja), "inne" (usługi nieprodukcyjne).
- "voivodeship": nazwa województwa małymi literami bez znaków diakrytycznych, np. "mazowieckie", "warminsko-mazurskie", "lubelskie". Jeśli podano tylko miasto — ustal województwo tego miasta. Jeśli brak informacji — "".
- "years5": "tak" jeśli z opisu wynika, że firma działa 5 lat lub dłużej; "nie" jeśli krócej niż 5 lat; "" jeśli nie wiadomo.
- "deminimis": "pelny" (nie korzystali z dotacji/pomocy de minimis), "czesciowy" (korzystali, ale niedużo), "wyczerpany" (limit wykorzystany), "" jeśli nie wspomniano.
- "liquidity": "tak" jeśli z opisu wynika, że firma może zapłacić z góry i czekać na refundację; "nie" jeśli wprost pisze o braku środków/płynności; "" jeśli nie wiadomo.
- "scale": "duzy" jeśli planują szerszy projekt cyfryzacji (ERP, automatyzacja, maszyny, kilka systemów); "maly" jeśli chodzi wyłącznie o sam paszport produktowy; "" jeśli nie wiadomo.
- "revenue": roczne przychody firmy. "do500" (poniżej 500 tys. zł), "do3mln" (od 500 tys. do 3 mln zł), "ponad3mln" (powyżej 3 mln zł). Jeśli nie podano kwoty przychodów — "".
- "profitable": "tak" jeśli firma pisze, że jest rentowna / ma zysk; "nie" jeśli pisze o stracie lub braku rentowności; "" jeśli nie wspomniano.
- "note": jedno krótkie zdanie po polsku streszczające, czym firma się zajmuje (na podstawie opisu).`;

const hits = new Map(); // best-effort limit (serwerless: pamięć bywa resetowana)

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Tylko POST" });

  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return res.status(503).json({ error: "Analiza AI chwilowo niedostępna — wypełnij pola poniżej ręcznie." });

  const text = ((req.body || {}).text || "").toString().trim();
  if (text.length < 15) return res.status(400).json({ error: "Opisz firmę w kilku zdaniach (min. 15 znaków)." });
  if (text.length > 2500) return res.status(400).json({ error: "Opis jest za długi — skróć do ok. 2500 znaków." });

  // prosty limit nadużyć
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > 60000) { rec.n = 0; rec.t = now; }
  rec.n++; hits.set(ip, rec);
  if (rec.n > 8) return res.status(429).json({ error: "Zbyt wiele zapytań — spróbuj za chwilę." });

  const call = () => fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: { "content-type": "application/json", "X-goog-api-key": KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT + "\n\nOPIS FIRMY:\n" + text }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA }
      })
    }
  );

  try {
    let r = await call(), j = await r.json();
    // model bywa chwilowo przeciążony — jedna cicha ponowna próba
    if (!r.ok && (r.status === 429 || r.status === 503)) {
      await new Promise(s => setTimeout(s, 1800));
      r = await call(); j = await r.json();
    }
    if (!r.ok) {
      const busy = r.status === 429 || r.status === 503;
      return res.status(busy ? 503 : 502).json({
        error: busy
          ? "Analiza AI jest chwilowo obciążona. Wypełnij proszę pola poniżej ręcznie — zajmie to chwilę i wynik będzie identyczny."
          : ((j.error && j.error.message) || ("Błąd analizy: HTTP " + r.status))
      });
    }
    const cand = (j.candidates || [])[0];
    const out = cand && cand.content && (cand.content.parts || []).map(p => p.text || "").join("");
    if (!out) return res.status(502).json({ error: "Nie udało się odczytać opisu — wypełnij pola poniżej ręcznie." });
    return res.status(200).json({ ok: true, fields: JSON.parse(out) });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
};
