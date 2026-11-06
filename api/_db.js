// Conexión a Redis (Upstash) por REST, sin dependencias
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function pipeline(cmds) {
  if (!URL_DB || !TOKEN) throw new Error("Base de datos no configurada");
  const r = await fetch(URL_DB.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("Redis " + r.status);
  return (await r.json()).map((x) => x.result);
}

// Fecha en hora de Madrid (AAAA-MM-DD)
const hoy = (d = new Date()) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

module.exports = { pipeline, hoy, configurada: () => !!(URL_DB && TOKEN) };
