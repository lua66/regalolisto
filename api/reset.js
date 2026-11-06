// Borra todas las estadísticas (solo con la clave del panel)
const crypto = require("crypto");
const { pipeline, configurada } = require("./_db");
const igual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const PATRONES = ["vistas*", "clics*", "visitas*", "sesiones", "clicsdia", "canal:*"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  const clave = process.env.PANEL_CLAVE;
  if (!clave || !igual(req.headers["x-clave"] || "", clave)) {
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "Clave incorrecta" });
  }
  if (!configurada()) return res.status(500).json({ error: "Base de datos no configurada" });
  try {
    const claves = new Set();
    for (const patron of PATRONES) {
      let cursor = "0";
      do {
        const [r] = await pipeline([["SCAN", cursor, "MATCH", patron, "COUNT", 500]]);
        cursor = String(r[0]); r[1].forEach((k) => claves.add(k));
      } while (cursor !== "0");
    }
    const lista = [...claves];
    for (let i = 0; i < lista.length; i += 200) await pipeline([["DEL", ...lista.slice(i, i + 200)]]);
    res.status(200).json({ borradas: lista.length });
  } catch (e) { res.status(503).json({ error: e.message }); }
};
