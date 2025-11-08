// src/stats.ts

// ===== Types =====
export type Rank = 'Bronze'|'Silver'|'Gold'|'Platinum'|'Diamond'|'Master'|'GM';
export type Role = 'Tank'|'DPS'|'Support';

export interface Hero {
  id: string;
  name: string;
  role: Role;
}

export interface MapInfo {
  id: string;           // slug (ex: 'route-66')
  name: string;         // label (ex: 'Route 66')
  mode: 'Hybrid'|'Escort'|'Control'|'Flashpoint'|'Push'|'Assault'|'Clash'|'Workshop';
  thumb: string;        // URL image (fallback web)
}

export interface TierRow {
  heroId: string;
  rank: Rank;
  mapId?: string;       // si défini -> stats spécifiques à la carte
  pickRate: number;     // 0..1
  winRate: number;      // 0..1
  sample: number;       // nombre de parties
  delta7d?: { pickRate: number; winRate: number }; // variation 7j
}

export interface Synergy {
  heroId: string;
  withHeroId: string;
  score: number;        // >0 synergie, <0 contre
}

export interface MatchItem {
  id: string;
  date: string;         // ISO
  mapId: string;
  heroId: string;
  result: 'Win'|'Loss';
  kda: [number, number, number]; // kills, deaths, assists
  rank: Rank;
}

// ===== Données (mock) =====
// Tu peux étendre ces listes. Les ids servent aussi à nommer les fichiers dans /public.
export const HEROES: Hero[] = [
  { id:'reinhardt', name:'Reinhardt', role:'Tank' },
  { id:'zarya',     name:'Zarya',     role:'Tank' },
  { id:'tracer',    name:'Tracer',    role:'DPS'  },
  { id:'ashe',      name:'Ashe',      role:'DPS'  },
  { id:'ana',       name:'Ana',       role:'Support' },
  { id:'lucio',     name:'Lucio',     role:'Support' },
];

export const MAPS: MapInfo[] = [
  { id:'route-66',  name:'Route 66',  mode:'Escort',
    thumb:'https://picsum.photos/seed/route-66/1200/675' },
  { id:'kings-row', name:"King's Row", mode:'Hybrid',
    thumb:'https://picsum.photos/seed/kings-row/1200/675' },
  { id:'ilios',     name:'Ilios',     mode:'Control',
    thumb:'https://picsum.photos/seed/ilios/1200/675' },
  { id:'junkertown', name:'Junkertown', mode:'Escort',
    thumb:'https://picsum.photos/seed/junkertown/1200/675' },
  { id:'lijiang-tower', name:'Lijiang Tower', mode:'Control',
    thumb:'https://picsum.photos/seed/lijiang-tower/1200/675' },
];

// ===== Utils =====
const clamp01 = (n:number)=>Math.max(0,Math.min(1,n));
const rnd = (a:number,b:number)=>a+Math.random()*(b-a);

export const HERO_NAME = (id:string)=>HEROES.find(h=>h.id===id)?.name||id;
export const MAP_NAME  = (id:string)=>MAPS.find(m=>m.id===id)?.name||id;

// Fallback “web” quand il n’y a pas d’image locale
export const MAP_THUMB = (id:string)=>MAPS.find(m=>m.id===id)?.thumb||'https://picsum.photos/seed/owgg/1200/675';

// Images locales (à placer dans /public)
export function MAP_IMAGE(mapId: string): string {
  // essaie /public/maps/<id>.jpg
  const slug = mapId.toLowerCase().replace(/\s+/g,'-');
  return `/maps/${slug}.jpg`;
}
export function HERO_ICON(heroId: string): string {
  // essaie /public/heroes/<id>.png
  const slug = heroId.toLowerCase().replace(/\s+/g,'-');
  return `/heroes/${slug}.png`;
}

// ===== Génération de stats mock =====
export function generateTierData(): TierRow[] {
  const ranks: Rank[] = ['Bronze','Silver','Gold','Platinum','Diamond','Master','GM'];
  const rows: TierRow[] = [];

  for (const h of HEROES) {
    for (const r of ranks) {
      // base WR selon rôle pour donner un peu de variété
      const base = h.role==='DPS' ? 0.485 : h.role==='Tank' ? 0.505 : 0.495;
      const wr = clamp01(base + rnd(-0.05,0.05));
      const pr = clamp01(0.04 + rnd(0,0.16));
      const sample = Math.floor(rnd(300, 7000));
      rows.push({
        heroId: h.id, rank: r, pickRate: pr, winRate: wr, sample,
        delta7d: { pickRate: rnd(-0.03,0.03), winRate: rnd(-0.04,0.04) }
      });

      // variantes par carte
      for (const m of MAPS) {
        const adj = m.mode==='Escort' ? 0.01 : m.mode==='Hybrid' ? -0.005 : 0;
        rows.push({
          heroId: h.id,
          rank: r,
          mapId: m.id,
          pickRate: clamp01(pr + rnd(-0.02,0.02)),
          winRate: clamp01(wr + adj + rnd(-0.03,0.03)),
          sample: Math.floor(sample * rnd(0.15,0.5)),
          delta7d: { pickRate: rnd(-0.03,0.03), winRate: rnd(-0.04,0.04) }
        });
      }
    }
  }
  return rows;
}

export function computeTierLetter(wr:number, sample:number){
  // petite pénalité si échantillon faible, bonus léger si très grand
  const conf = sample<200 ? -0.02 : sample>2500 ? +0.01 : 0;
  const score = wr + conf;
  if (score>=0.57) return 'S';
  if (score>=0.53) return 'A';
  if (score>=0.50) return 'B';
  if (score>=0.47) return 'C';
  return 'D';
}

export function listSynergies(rows:TierRow[], heroId:string, rank:Rank, mapId?:string): Synergy[] {
  // Heuristique simple: compare winrate d'autres héros vs le héros de base
  const base = rows.find(r=>r.heroId===heroId && r.rank===rank && (!mapId || r.mapId===mapId));
  if(!base) return [];
  const out: Synergy[] = [];
  for(const h of HEROES){
    if(h.id===heroId) continue;
    const r = rows.find(x=>x.heroId===h.id && x.rank===rank && (!mapId || x.mapId===mapId));
    if(!r) continue;
    out.push({ heroId, withHeroId:h.id, score: +(r.winRate - base.winRate).toFixed(3) });
  }
  // tri décroissant et retourne quelques éléments (utilisé côté UI)
  out.sort((a,b)=>b.score-a.score);
  return out;
}

export function generateMatches(rows:TierRow[]): MatchItem[] {
  // 24 matchs simulés
  const picks = rows.filter(r=>!r.mapId && r.rank==='Platinum');
  const out: MatchItem[] = [];
  for(let i=0;i<24;i++){
    const p = picks[Math.floor(Math.random()*picks.length)];
    const m = MAPS[Math.floor(Math.random()*MAPS.length)];
    const res = Math.random() < p.winRate ? 'Win' : 'Loss';
    const k = Math.floor(rnd(6,22));
    const d = Math.floor(rnd(2,12));
    const a = Math.floor(rnd(3,18));
    out.push({
      id: 'm'+i,
      date: new Date(Date.now()-i*3600*1000).toISOString(),
      mapId: m.id,
      heroId: p.heroId,
      result: res,
      kda: [k,d,a],
      rank: 'Platinum'
    });
  }
  return out;
}

// ===== Format helpers =====
export function fmtPct(n:number){ return (n*100).toFixed(1)+'%'; }
export function fmtDelta(n:number){
  const s = (n*100).toFixed(1)+'%';
  return n>0 ? `↑ ${s}` : n<0 ? `↓ ${s}` : '—';
}
