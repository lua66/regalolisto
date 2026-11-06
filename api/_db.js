// Conexión a Redis (Upstash) por REST, sin dependencias
// Busca las claves de Upstash con cualquier prefijo (KV_, STORAGE_, UPSTASH_REDIS_...)
const buscar = (fin) => process.env["KV" + fin] || process.env["UPSTASH_REDIS" + fin] ||
  Object.entries(process.env).find(([k]) => k.endsWith(fin) && !k.includes("READ_ONLY"))?.[1];
const URL_DB = buscar("_REST_API_URL") || buscar("_REST_URL");
const TOKEN = buscar("_REST_API_TOKEN") || buscar("_REST_TOKEN");

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
