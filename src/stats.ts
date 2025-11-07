// src/stats.ts
export type Rank = 'Bronze'|'Silver'|'Gold'|'Platinum'|'Diamond'|'Master'|'GM';
export type Role = 'Tank'|'DPS'|'Support';

export interface Hero {
  id: string;
  name: string;
  role: Role;
}

export interface MapInfo {
  id: string;
  name: string;
  mode: 'Hybrid'|'Escort'|'Control'|'Flashpoint'|'Push'|'Assault'|'Clash'|'Workshop';
  thumb: string; // url image
}

export interface TierRow {
  heroId: string;
  rank: Rank;
  mapId?: string;
  pickRate: number;    // 0..1
  winRate: number;     // 0..1
  sample: number;      // nombre de parties
  delta7d?: { pickRate: number; winRate: number }; // variation sur 7 jours
}

export interface Synergy {
  heroId: string;
  withHeroId: string;
  score: number; // positif = synergie, négatif = contre
}

export interface MatchItem {
  id: string;
  date: string;      // ISO
  mapId: string;
  heroId: string;
  result: 'Win'|'Loss';
  kda: [number, number, number];
  rank: Rank;
}

// ========= Données mock (remplace plus tard par API réelles) =========
export const HEROES: Hero[] = [
  { id:'rein', name:'Reinhardt', role:'Tank' },
  { id:'zarya', name:'Zarya', role:'Tank' },
  { id:'tracer', name:'Tracer', role:'DPS' },
  { id:'ashe', name:'Ashe', role:'DPS' },
  { id:'ana', name:'Ana', role:'Support' },
  { id:'lucio', name:'Lucio', role:'Support' },
];

export const MAPS: MapInfo[] = [
  { id:'route-66', name:'Route 66', mode:'Escort',
    thumb:'https://picsum.photos/seed/route-66/800/450' },
  { id:'kings-row', name:"King's Row", mode:'Hybrid',
    thumb:'https://picsum.photos/seed/king-s-row/800/450' },
  { id:'ilios', name:'Ilios', mode:'Control',
    thumb:'https://picsum.photos/seed/ilios/800/450' },
];

// Variation util
const clamp01 = (n:number)=>Math.max(0,Math.min(1,n));
const rnd = (a:number,b:number)=>a+Math.random()*(b-a);

// Génère des stats par héros/rang + deltas 7j
export function generateTierData(): TierRow[] {
  const ranks: Rank[] = ['Bronze','Silver','Gold','Platinum','Diamond','Master','GM'];
  const rows: TierRow[] = [];
  for (const h of HEROES) {
    for (const r of ranks) {
      const base = h.role==='DPS'?0.47:h.role==='Tank'?0.5:0.49;
      const wr = clamp01(base + rnd(-0.05,0.05));
      const pr = clamp01(0.04 + rnd(0,0.15));
      const sample = Math.floor(rnd(200, 6000));
      rows.push({
        heroId: h.id, rank: r, pickRate: pr, winRate: wr, sample,
        delta7d: { pickRate: rnd(-0.03,0.03), winRate: rnd(-0.04,0.04) }
      });
      // variantes cartes
      for (const m of MAPS) {
        const adj = m.mode==='Escort'?0.01: m.mode==='Hybrid'?-0.005:0.0;
        rows.push({
          heroId: h.id, rank: r, mapId: m.id,
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
  // barre “confiance”: échantillon < 200 => - grade doux
  const conf = sample<200 ? -0.02 : sample>2000 ? +0.01 : 0;
  const score = wr + conf;
  if (score>=0.57) return 'S';
  if (score>=0.53) return 'A';
  if (score>=0.50) return 'B';
  if (score>=0.47) return 'C';
  return 'D';
}

export function listSynergies(rows:TierRow[], heroId:string, rank:Rank, mapId?:string): Synergy[] {
  // Mock simple: compare corrélations de winrate aux autres héros
  const base = rows.filter(r=>r.heroId===heroId && r.rank===rank && (!mapId || r.mapId===mapId))[0];
  if(!base) return [];
  const OUT: Synergy[] = [];
  for(const h of HEROES){
    if(h.id===heroId) continue;
    const r = rows.filter(x=>x.heroId===h.id && x.rank===rank && (!mapId || x.mapId===mapId))[0];
    if(!r) continue;
    OUT.push({ heroId, withHeroId:h.id, score: +(r.winRate - base.winRate).toFixed(3) });
  }
  OUT.sort((a,b)=>b.score-a.score);
  return OUT.slice(0,3).concat(OUT.slice(-3)); // top 3 + worst 3
}

export function generateMatches(rows:TierRow[]): MatchItem[] {
  // 24 matchs simulés triés par date desc
  const picks = rows.filter(r=>!r.mapId && r.rank==='Platinum');
  const out: MatchItem[] = [];
  for(let i=0;i<24;i++){
    const p = picks[Math.floor(Math.random()*picks.length)];
    const m = MAPS[Math.floor(Math.random()*MAPS.length)];
    const res = Math.random() < p.winRate ? 'Win' : 'Loss';
    out.push({
      id: 'm'+i,
      date: new Date(Date.now()-i*3600*1000).toISOString(),
      mapId: m.id,
      heroId: p.heroId,
      result: res,
      kda: [Math.floor(rnd(5,22)), Math.floor(rnd(2,14)), Math.floor(rnd(3,18))],
      rank: 'Platinum'
    });
  }
  return out;
}

export function fmtPct(n:number){ return (n*100).toFixed(1)+'%'; }
export function fmtDelta(n:number){
  const s = (n*100).toFixed(1)+'%';
  return n>0 ? `↑ ${s}` : n<0 ? `↓ ${s}` : '—';
}
export const HERO_NAME = (id:string)=>HEROES.find(h=>h.id===id)?.name||id;
export const MAP_NAME  = (id:string)=>MAPS.find(m=>m.id===id)?.name||id;
export const MAP_THUMB = (id:string)=>MAPS.find(m=>m.id===id)?.thumb||'';
