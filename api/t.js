// Registra eventos de la web: v = visita, i = productos vistos, c = clic en "Ver precio en Amazon"
const { pipeline, hoy } = require("./_db");
const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless/i;
const PAGINAS = ["inicio", "regalos", "tecnologia", "juguetes", "belleza", "hogar"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  if (BOTS.test(req.headers["user-agent"] || "")) return res.status(204).end();
  let b = req.body;
  try { if (typeof b === "string") b = JSON.parse(b); } catch { return res.status(400).end(); }
  if (!b || typeof b !== "object") return res.status(400).end();

  const d = hoy();
  const asin = (x) => typeof x === "string" && /^[A-Z0-9]{10}$/.test(x);
  const cmds = [];
  if (b.e === "v" && PAGINAS.includes(b.p)) {
    cmds.push(["HINCRBY", "visitas:" + d, b.p, 1], ["HINCRBY", "visitas:total", b.p, 1]);
    if (b.nueva) cmds.push(["HINCRBY", "sesiones", d, 1]);
  } else if (b.e === "i" && Array.isArray(b.a)) {
    b.a.filter(asin).slice(0, 12).forEach((a) => cmds.push(["HINCRBY", "vistas", a, 1], ["HINCRBY", "vistas:" + d, a, 1]));
  } else if (b.e === "c" && asin(b.a)) {
    cmds.push(["HINCRBY", "clics", b.a, 1], ["HINCRBY", "clics:" + d, b.a, 1], ["HINCRBY", "clicsdia", d, 1]);
  }
  if (!cmds.length) return res.status(400).end();
  try { await pipeline(cmds); res.status(204).end(); }
  catch (e) { res.status(503).json({ error: e.message }); }
};
