// src/data.ts
export type Rank = 'Bronze'|'Silver'|'Gold'|'Platinum'|'Diamond'|'Master'|'GM'|'Top500';
export type Role = 'Tank'|'DPS'|'Support';

export type Hero = {
  id: string; name: string; role: Role; portrait: string;
};
export type Match = {
  id: string;
  dateISO: string;
  win: boolean;
  heroId: string;
  mapSlug: string;
  mapName: string;
  k: number; d: number; a: number;
  teamSynergy: string[]; // ex: ["Lucio +2.3%", "Reinhardt +4.1%"]
};

export type TierRow = {
  heroId: string; tier: 'A'|'B'|'C'|'D';
  winrate: number; pick: number; deltaWin: number; deltaPick: number; sample: number;
  role: Role;
  bestWith: string[]; counters: string[];
};

export const HEROES: Hero[] = [
  { id:'reinhardt', name:'Reinhardt', role:'Tank', portrait:'/heroes/reinhardt.png' },
  { id:'tracer', name:'Tracer', role:'DPS', portrait:'/heroes/tracer.png' },
  { id:'lucio', name:'Lúcio', role:'Support', portrait:'/heroes/lucio.png' },
  { id:'ana', name:'Ana', role:'Support', portrait:'/heroes/ana.png' },
  { id:'zarya', name:'Zarya', role:'Tank', portrait:'/heroes/zarya.png' },
  { id:'ashe', name:'Ashe', role:'DPS', portrait:'/heroes/ashe.png' },
];

export const TIER: TierRow[] = [
  { heroId:'reinhardt', tier:'A', winrate:55.1, pick:4.6, deltaWin:-3.2, deltaPick:2.4, sample:6998, role:'Tank', bestWith:['Zarya +2.6%','Lucio +2.3%'], counters:['Ashe -4.8%','Tracer -4.1%'] },
  { heroId:'zarya', tier:'B', winrate:52.5, pick:19.7, deltaWin:0.5, deltaPick:-2.6, sample:2367, role:'Tank', bestWith:['Reinhardt +2.6%'], counters:['Ana -2.2%','Tracer -1.5%'] },
  { heroId:'tracer', tier:'B', winrate:50.9, pick:12.1, deltaWin:-3.6, deltaPick:0.4, sample:4596, role:'DPS', bestWith:['Reinhardt +4.1%','Zarya +1.5%'], counters:['Ana -0.7%'] },
  { heroId:'ana', tier:'B', winrate:50.3, pick:18.6, deltaWin:-0.9, deltaPick:-0.3, sample:6411, role:'Support', bestWith:['Reinhardt +4.8%','Zarya +2.2%'], counters:['Tracer +0.7%'] },
  { heroId:'ashe', tier:'D', winrate:45.1, pick:9.2, deltaWin:-3.0, deltaPick:1.2, sample:1246, role:'DPS', bestWith:['Reinhardt +10.0%'], counters:['Tracer +5.8%','Zarya +7.4%'] },
  { heroId:'lucio', tier:'D', winrate:44.9, pick:12.2, deltaWin:-3.8, deltaPick:0.4, sample:6937, role:'Support', bestWith:['Reinhardt +10.2%','Zarya +7.6%'], counters:['Tracer +6.1%'] },
];

// Cartes -> fichier image (mets les .jpg correspondants dans /public/maps/)
export const MAP_IMAGES: Record<string, string> = {
  'route-66': '/maps/route-66.jpg',
  'kings-row': '/maps/kings-row.jpg',
  'ilios': '/maps/ilios.jpg',
  'junkertown': '/maps/junkertown.jpg'
};

export const MATCHES: Match[] = [
  { id:'m1', dateISO:'2025-11-09T19:13:27Z', win:false, heroId:'lucio', mapSlug:'junkertown', mapName:'Junkertown', k:9, d:4, a:11, teamSynergy:['Reinhardt +10.2%','Zarya +7.6%'] },
  { id:'m2', dateISO:'2025-11-09T18:13:27Z', win:false, heroId:'ana', mapSlug:'kings-row', mapName:"King's Row", k:8, d:4, a:4, teamSynergy:['Reinhardt +4.8%'] },
  { id:'m3', dateISO:'2025-11-09T17:13:27Z', win:false, heroId:'zarya', mapSlug:'route-66', mapName:'Route 66', k:17, d:4, a:14, teamSynergy:['Tracer +5.8%'] },
  { id:'m4', dateISO:'2025-11-09T16:13:27Z', win:true,  heroId:'lucio', mapSlug:'ilios', mapName:'Ilios', k:16, d:5, a:5, teamSynergy:['Tracer +6.1%'] },
  { id:'m5', dateISO:'2025-11-09T15:13:27Z', win:true,  heroId:'tracer', mapSlug:'ilios', mapName:'Ilios', k:17, d:2, a:4, teamSynergy:['Reinhardt +4.1%'] },
];
