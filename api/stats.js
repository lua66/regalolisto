// Devuelve las estadísticas para el panel privado (requiere la clave del panel)
const crypto = require("crypto");
const { pipeline, hoy, configurada } = require("./_db");

const igual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const clave = process.env.PANEL_CLAVE;
  if (!clave) return res.status(500).json({ error: "Falta configurar PANEL_CLAVE en Vercel" });
  // Acceso de solo lectura para el informe automático semanal (?t=...); aquí solo se guarda su huella
  const INFORME = "a29efafb116f120e072d5a9f7f86d75b9225563e4ff65ed0981d145732b4c6f2";
  const t = (req.query && req.query.t) || "";
  const porInforme = t && igual(crypto.createHash("sha256").update(String(t)).digest("hex"), INFORME);
  if (!porInforme && !igual(req.headers["x-clave"] || "", clave)) {
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "Clave incorrecta" });
  }
  if (!configurada()) return res.status(500).json({ error: "Falta conectar la base de datos (Upstash Redis) en Vercel" });

  const dias = [];
  for (let i = 13; i >= 0; i--) dias.push(hoy(new Date(Date.now() - i * 864e5)));
  const d = dias[dias.length - 1];
  try {
    const r = await pipeline([
      ["HGETALL", "vistas"], ["HGETALL", "clics"], ["HGETALL", "visitas:total"],
      ["HGETALL", "vistas:" + d], ["HGETALL", "clics:" + d], ["HGETALL", "visitas:" + d],
      ["HMGET", "sesiones", ...dias], ["HMGET", "clicsdia", ...dias],
      ["HGETALL", "canal:visitas"], ["HGETALL", "canal:clics"],
    ]);
    const obj = (a) => { const o = {}; for (let i = 0; a && i < a.length; i += 2) o[a[i]] = +a[i + 1]; return o; };
    res.status(200).json({
      hoy: d, vistas: obj(r[0]), clics: obj(r[1]), visitas: obj(r[2]),
      vistasHoy: obj(r[3]), clicsHoy: obj(r[4]), visitasHoy: obj(r[5]),
      dias, sesionesDia: r[6].map((x) => +x || 0), clicsDia: r[7].map((x) => +x || 0),
      canalVisitas: obj(r[8]), canalClics: obj(r[9]),
    });
  } catch (e) { res.status(503).json({ error: e.message }); }
};
