/** Types de base */
export type Role = "Tank" | "DPS" | "Support";

export type Hero = {
  id: string;
  name: string;
  role: Role;
  tier: "S" | "A" | "B" | "C" | "D";
  winrate: number; // 0..1
  pickrate: number; // 0..1
  sample: number;
  deltaWin: number; // en points de % (ex: +0.8 => +0.8%)
  deltaPick: number;
  portrait: string; // chemin local
  synergies: Array<{ with: string; delta: number }>;
  counters: Array<{ vs: string; delta: number }>;
};

export type MapId =
  | "route-66"
  | "kings-row"
  | "ilios"
  | "junkertown";

export type Match = {
  id: string;
  when: string;              // ISO ou déjà prêt à afficher
  mapId: MapId;
  mapName: string;
  heroId: string;            // héros le plus joué
  heroName: string;
  heroAvatar: string;        // chemin local
  k: number;
  d: number;
  a: number;
  victory: boolean;
};

/** Dictionnaire d’images locales de maps (mets tes fichiers dans /public/assets/maps) */
export const MAP_IMAGES: Record<MapId, string> = {
  "route-66": "/assets/maps/route-66.jpg",
  "kings-row": "/assets/maps/kings-row.jpg",
  "ilios": "/assets/maps/ilios.jpg",
  "junkertown": "/assets/maps/junkertown.jpg"
};

/** Héros (exemple / démo) -> mets tes portraits dans /public/assets/heroes */
export const HEROES: Hero[] = [
  {
    id: "reinhardt",
    name: "Reinhardt",
    role: "Tank",
    tier: "A",
    winrate: 0.551,
    pickrate: 0.046,
    sample: 6998,
    deltaWin: -0.32,
    deltaPick: +0.24,
    portrait: "/assets/heroes/reinhardt.png",
    synergies: [
      { with: "Zarya", delta: +2.6 },
      { with: "Lucio", delta: +2.3 }
    ],
    counters: [
      { vs: "Ana", delta: -0.8 },
      { vs: "Tracer", delta: -1.1 }
    ]
  },
  {
    id: "lucio",
    name: "Lucio",
    role: "Support",
    tier: "D",
    winrate: 0.449,
    pickrate: 0.122,
    sample: 6937,
    deltaWin: -0.38,
    deltaPick: +0.04,
    portrait: "/assets/heroes/lucio.png",
    synergies: [
      { with: "Reinhardt", delta: +1.2 },
      { with: "Tracer", delta: +0.6 }
    ],
    counters: [
      { vs: "Ana", delta: -1.3 },
      { vs: "Zarya", delta: -0.7 }
    ]
  },
  {
    id: "zarya",
    name: "Zarya",
    role: "Tank",
    tier: "B",
    winrate: 0.525,
    pickrate: 0.197,
    sample: 2367,
    deltaWin: +0.5,
    deltaPick: -0.26,
    portrait: "/assets/heroes/zarya.png",
    synergies: [
      { with: "Reinhardt", delta: +1.5 },
      { with: "Lucio", delta: +0.8 }
    ],
    counters: [
      { vs: "Ana", delta: -0.9 },
      { vs: "Tracer", delta: -0.6 }
    ]
  },
  {
    id: "tracer",
    name: "Tracer",
    role: "DPS",
    tier: "B",
    winrate: 0.509,
    pickrate: 0.121,
    sample: 4596,
    deltaWin: -0.36,
    deltaPick: +0.04,
    portrait: "/assets/heroes/tracer.png",
    synergies: [
      { with: "Lucio", delta: +0.7 },
      { with: "Ana", delta: +0.3 }
    ],
    counters: [
      { vs: "Reinhardt", delta: -0.9 },
      { vs: "Zarya", delta: -0.7 }
    ]
  },
  {
    id: "ana",
    name: "Ana",
    role: "Support",
    tier: "B",
    winrate: 0.503,
    pickrate: 0.186,
    sample: 6411,
    deltaWin: -0.09,
    deltaPick: -0.03,
    portrait: "/assets/heroes/ana.png",
    synergies: [
      { with: "Zarya", delta: +0.6 },
      { with: "Reinhardt", delta: +0.4 }
    ],
    counters: [
      { vs: "Lucio", delta: +1.3 },
      { vs: "Tracer", delta: +0.8 }
    ]
  }
];

/** Historique de matchs (démo) -> mets des images de maps dans /public/assets/maps */
export const MATCHES: Match[] = [
  {
    id: "m1",
    when: "09/11/2025 20:13:27",
    mapId: "junkertown",
    mapName: "Junkertown",
    heroId: "lucio",
    heroName: "Lucio",
    heroAvatar: "/assets/heroes/lucio.png",
    k: 9, d: 4, a: 11,
    victory: false
  },
  {
    id: "m2",
    when: "09/11/2025 19:13:27",
    mapId: "kings-row",
    mapName: "King's Row",
    heroId: "ana",
    heroName: "Ana",
    heroAvatar: "/assets/heroes/ana.png",
    k: 8, d: 4, a: 4,
    victory: false
  },
  {
    id: "m3",
    when: "09/11/2025 16:13:27",
    mapId: "route-66",
    mapName: "Route 66",
    heroId: "zarya",
    heroName: "Zarya",
    heroAvatar: "/assets/heroes/zarya.png",
    k: 20, d: 6, a: 3,
    victory: true
  },
  {
    id: "m4",
    when: "09/11/2025 15:13:27",
    mapId: "ilios",
    mapName: "Ilios",
    heroId: "tracer",
    heroName: "Tracer",
    heroAvatar: "/assets/heroes/tracer.png",
    k: 17, d: 2, a: 4,
    victory: true
  }
];

/** Utilitaires d’affichage */
export function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}
export function signed(n: number): string {
  const s = n >= 0 ? "+" : "";
  return s + n.toFixed(1) + "%";
}
