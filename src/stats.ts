// src/stats.ts
// Données "seed" simples pour la démo (tier list + historique).
// Les chemins d'images pointent vers /heroes et /maps (Option 1 choisie par toi).

/* ===========================
   Types
=========================== */

export type Role = "Tank" | "Support" | "DPS";

export interface Hero {
  id: string;
  name: string;
  role: Role;
  portrait: string; // /heroes/*.png
  color: string; // badge color
}

export interface MapT {
  id: string;
  name: string;
  code: string; // petit code affiché éventuellement
  image: string; // /maps/*.jpg
}

/* ===========================
   Images de cartes (Option 1)
=========================== */

export const MAP_IMAGES: Record<string, string> = {
  "route-66": "/maps/route-66.jpg",
  "kings-row": "/maps/kings-row.jpg",
  ilios: "/maps/ilios.jpg",
  junkertown: "/maps/junkertown.jpg",
};

/* ===========================
   Cartes
=========================== */

export const MAPS: MapT[] = [
  { id: "route-66", name: "Route 66", code: "R66", image: MAP_IMAGES["route-66"] },
  { id: "kings-row", name: "King's Row", code: "KR", image: MAP_IMAGES["kings-row"] },
  { id: "ilios", name: "Ilios", code: "IL", image: MAP_IMAGES["ilios"] },
  { id: "junkertown", name: "Junkertown", code: "JT", image: MAP_IMAGES["junkertown"] },
];

export const MAP_BY_ID: Record<string, MapT> = Object.fromEntries(
  MAPS.map((m) => [m.id, m])
);

/* ===========================
   Héros (portraits Option 1)
=========================== */

export const HEROES: Hero[] = [
  {
    id: "reinhardt",
    name: "Reinhardt",
    role: "Tank",
    portrait: "/heroes/reinhardt.png",
    color: "#22c55e",
  },
  {
    id: "lucio",
    name: "Lucio",
    role: "Support",
    portrait: "/heroes/lucio.png",
    color: "#22c55e",
  },
  {
    id: "zarya",
    name: "Zarya",
    role: "Tank",
    portrait: "/heroes/zarya.png",
    color: "#60a5fa",
  },
  {
    id: "tracer",
    name: "Tracer",
    role: "DPS",
    portrait: "/heroes/tracer.png",
    color: "#60a5fa",
  },
  {
    id: "ana",
    name: "Ana",
    role: "Support",
    portrait: "/heroes/ana.png",
    color: "#60a5fa",
  },
];

export const HERO_BY_ID: Record<string, Hero> = Object.fromEntries(
  HEROES.map((h) => [h.id, h])
);

/* ===========================
   Synergies / Contres (exemple simple)
=========================== */

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

/* ===========================
   Fake tier list (valeurs demo)
=========================== */

export interface TierRow {
  heroId: string;
  winrate: number; // 0..1
  pick: number; // 0..1
  sample: number;
  deltaWin?: number; // 0..1 (var jour/sem)
  deltaPick?: number; // 0..1
}

export const TIER_LIST: TierRow[] = [
  { heroId: "reinhardt", winrate: 0.551, pick: 0.046, sample: 6998, deltaWin: -0.032, deltaPick: 0.024 },
  { heroId: "zarya", winrate: 0.525, pick: 0.197, sample: 2367, deltaWin: 0.005, deltaPick: -0.026 },
  { heroId: "tracer", winrate: 0.509, pick: 0.121, sample: 4596, deltaWin: -0.036, deltaPick: 0.004 },
  { heroId: "ana", winrate: 0.503, pick: 0.186, sample: 6411, deltaWin: -0.009, deltaPick: -0.003 },
  { heroId: "ashe", winrate: 0.451, pick: 0.092, sample: 1246, deltaWin: -0.03, deltaPick: 0.012 },
  { heroId: "lucio", winrate: 0.449, pick: 0.122, sample: 6937, deltaWin: -0.038, deltaPick: 0.004 },
];

/* ===========================
   Historique — générateur
=========================== */

export interface MatchRow {
  id: string;
  at: number; // timestamp
  heroId: string;
  mapId: string;
  win: boolean;
  k: number;
  d: number;
  a: number;
}

function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function generateFakeMatches(n = 12): MatchRow[] {
  const maps = MAPS.map((m) => m.id);
  const heroes = HEROES.map((h) => h.id);

  const rows: MatchRow[] = [];
  for (let i = 0; i < n; i++) {
    const heroId = heroes[rand(0, heroes.length - 1)];
    const mapId = maps[rand(0, maps.length - 1)];
    const win = Math.random() > 0.45;
    const k = rand(3, 28);
    const d = rand(2, 18);
    const a = rand(3, 24);
    rows.push({
      id: `m${i}-${Date.now() - i * 3600_000}`,
      at: Date.now() - i * 3600_000,
      heroId,
      mapId,
      win,
      k,
      d,
      a,
    });
  }
  return rows;
}

/* ===========================
   Helpers
=========================== */

export function getSynergies(heroId: string): Hero[] {
  const ids = SYNERGIES[heroId] ?? [];
  return ids.map((id) => HERO_BY_ID[id]).filter(Boolean);
}

export function getCounters(heroId: string): Hero[] {
  const ids = COUNTERS[heroId] ?? [];
  return ids.map((id) => HERO_BY_ID[id]).filter(Boolean);
}
