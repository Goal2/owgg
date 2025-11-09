// src/stats.ts
export type Role = "Tank" | "Support" | "DPS";

export interface Hero {
  id: string;
  name: string;
  role: Role;
  portrait: string;
  color: string;
}

export interface MapT {
  id: string;
  name: string;
  code: string;
  image: string;
}

/* ========= Chemins robustes =========
   - fonctionne en local, Vercel, sous-répertoires.
*/
const BASE = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
const asset = (p: string) => `${BASE}/${p.replace(/^\/+/, "")}`;

/* ========= Maps ========= */
export const MAPS: MapT[] = [
  { id: "route-66",   name: "Route 66",   code: "R66", image: asset("maps/route-66.jpg") },
  { id: "kings-row",  name: "King's Row", code: "KR",  image: asset("maps/kings-row.jpg") },
  { id: "ilios",      name: "Ilios",      code: "IL",  image: asset("maps/ilios.jpg") },
  { id: "junkertown", name: "Junkertown", code: "JT",  image: asset("maps/junkertown.jpg") },
];
export const MAP_BY_ID: Record<string, MapT> = Object.fromEntries(MAPS.map(m => [m.id, m]));

/* ========= Héros ========= */
export const HEROES: Hero[] = [
  { id: "reinhardt", name: "Reinhardt", role: "Tank",    portrait: asset("heroes/reinhardt.png"), color: "#22c55e" },
  { id: "lucio",     name: "Lucio",     role: "Support", portrait: asset("heroes/lucio.png"),     color: "#22c55e" },
  { id: "zarya",     name: "Zarya",     role: "Tank",    portrait: asset("heroes/zarya.png"),     color: "#60a5fa" },
  { id: "tracer",    name: "Tracer",    role: "DPS",     portrait: asset("heroes/tracer.png"),    color: "#60a5fa" },
  { id: "ana",       name: "Ana",       role: "Support", portrait: asset("heroes/ana.png"),       color: "#60a5fa" },
];
export const HERO_BY_ID: Record<string, Hero> = Object.fromEntries(HEROES.map(h => [h.id, h]));

/* ========= Synergies / contres (démo) ========= */
export const SYNERGIES: Record<string, string[]> = {
  reinhardt: ["lucio", "ana", "zarya"],
  lucio: ["reinhardt", "zarya", "tracer"],
  zarya: ["reinhardt", "lucio", "tracer"],
  tracer: ["lucio", "zarya"],
  ana: ["reinhardt", "zarya"],
};
export const COUNTERS: Record<string, string[]> = {
  reinhardt: ["zarya", "ana"],
  lucio: ["ana"],
  zarya: ["reinhardt", "tracer"],
  tracer: ["reinhardt"],
  ana: ["tracer"],
};

/* ========= Tier list (démo) ========= */
export interface TierRow {
  heroId: string;
  winrate: number;
  pick: number;
  sample: number;
  deltaWin?: number;
  deltaPick?: number;
}
export const TIER_LIST: TierRow[] = [
  { heroId: "reinhardt", winrate: 0.551, pick: 0.046, sample: 6998, deltaWin: -0.032, deltaPick: 0.024 },
  { heroId: "zarya",     winrate: 0.525, pick: 0.197, sample: 2367, deltaWin:  0.005, deltaPick: -0.026 },
  { heroId: "tracer",    winrate: 0.509, pick: 0.121, sample: 4596, deltaWin: -0.036, deltaPick: 0.004 },
  { heroId: "ana",       winrate: 0.503, pick: 0.186, sample: 6411, deltaWin: -0.009, deltaPick: -0.003 },
  { heroId: "ashe",      winrate: 0.451, pick: 0.092, sample: 1246, deltaWin: -0.03,  deltaPick: 0.012 },
  { heroId: "lucio",     winrate: 0.449, pick: 0.122, sample: 6937, deltaWin: -0.038, deltaPick: 0.004 },
];

/* ========= Historique (démo) ========= */
export interface MatchRow {
  id: string;
  at: number;
  heroId: string;
  mapId: string;
  win: boolean;
  k: number; d: number; a: number;
}
const rint = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

export function generateFakeMatches(n = 12): MatchRow[] {
  const maps = MAPS.map(m => m.id);
  const heroes = HEROES.map(h => h.id);
  const rows: MatchRow[] = [];
  for (let i = 0; i < n; i++) {
    const heroId = heroes[rint(0, heroes.length - 1)];
    const mapId = maps[rint(0, maps.length - 1)];
    rows.push({
      id: `m${i}-${Date.now() - i * 3600_000}`,
      at: Date.now() - i * 3600_000,
      heroId,
      mapId,
      win: Math.random() > 0.45,
      k: rint(3, 28),
      d: rint(2, 18),
      a: rint(3, 24),
    });
  }
  return rows;
}

/* ========= Helpers ========= */
export function getSynergies(id: string) { return (SYNERGIES[id] ?? []).map(h => HERO_BY_ID[h]).filter(Boolean); }
export function getCounters(id: string)  { return (COUNTERS[id]  ?? []).map(h => HERO_BY_ID[h]).filter(Boolean); }

/* ========= Précharge & logs d’erreurs ========= */
export function preloadAllImages() {
  const urls = [
    ...MAPS.map(m => m.image),
    ...HEROES.map(h => h.portrait),
  ];
  urls.forEach(u => {
    const img = new Image();
    img.onload = () => { /* ok */ };
    img.onerror = () => console.warn("Image introuvable:", u);
    img.src = u;
  });
}
