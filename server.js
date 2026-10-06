const express = require("express");
const zlib = require("zlib");
const { Storage } = require("megajs");

const app = express();
const DATA = { ANIME: [], MANGA: [] };
let updatedAt = null;

async function loadFromMega() {
  const storage = await new Storage({ email: process.env.MEGA_EMAIL, password: process.env.MEGA_PASSWORD }).ready;
  const folder = storage.root.children.find((n) => n.name === "anilist");
  if (!folder) throw new Error('Dossier MEGA "anilist" introuvable');
  for (const type of ["ANIME", "MANGA"]) {
    const file = folder.children.find((n) => n.name === `${type.toLowerCase()}.json.gz`);
    if (!file) { console.warn("Fichier manquant:", type); continue; }
    DATA[type] = JSON.parse(zlib.gunzipSync(await file.downloadBuffer()).toString("utf8"));
    console.log(type, DATA[type].length);
  }
  updatedAt = new Date().toISOString();
  storage.close();
}
const refresh = () => loadFromMega().catch((e) => console.error("MEGA:", e.message));
refresh(); setInterval(refresh, 6 * 3600 * 1000);

app.use(express.static("public"));

app.get("/api/catalogue", (req, res) => {
  const type = req.query.type === "MANGA" ? "MANGA" : "ANIME";
  const q = String(req.query.q || "").toLowerCase().trim();
  const genre = req.query.genre || "";
  const sort = req.query.sort || "popularity";
  const page = Math.max(1, +req.query.page || 1), size = 48;
  let list = DATA[type].filter((m) => !m.isAdult);
  if (genre) list = list.filter((m) => m.genres.includes(genre));
  if (q) list = list.filter((m) => Object.values(m.title).some((t) => t && t.toLowerCase().includes(q)));
  list = [...list].sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
  res.json({
    total: list.length, page, pages: Math.ceil(list.length / size), updatedAt,
    counts: { ANIME: DATA.ANIME.length, MANGA: DATA.MANGA.length },
    items: list.slice((page - 1) * size, page * size),
  });
});

app.get("/api/genres", (req, res) => {
  const s = new Set();
  for (const t of ["ANIME", "MANGA"]) for (const m of DATA[t]) m.genres.forEach((g) => s.add(g));
  res.json([...s].sort());
});

app.listen(process.env.PORT || 3000, () => console.log("Catalogue prêt"));
