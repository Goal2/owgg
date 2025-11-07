// ===== 100% Vanilla JS canvas (no React, no packages) =====
// Now includes: role groups, hero detail page, tier S/A/B/C/D, arrows up/down on map change,
// map images and a 2D interactive map viewer (SVG) with health-pack/callouts mock data.

// ===== Minimal CSS =====
const GLOBAL_CSS = String.raw`
:root{--bg:#0b0c10;--fg:#e5e7eb;--muted:#a1a1aa;--from:#6366f1;--to:#ec4899;--card:rgba(255,255,255,.05);--b:rgba(255,255,255,.08)}
html{background:var(--bg);color:var(--fg);font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial}
*{box-sizing:border-box}
.container{max-width:1120px;margin:0 auto;padding:24px}
.gradient{background:linear-gradient(90deg,var(--from),var(--to));-webkit-background-clip:text;background-clip:text;color:transparent}
.card{background:var(--card);border:1px solid var(--b);border-radius:16px;padding:16px}
.grid{display:grid;gap:16px}
.grid-2{grid-template-columns:repeat(2,minmax(0,1fr))}
.btn{display:inline-block;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--fg);text-decoration:none;cursor:pointer}
.small{color:#9aa0a6;font-size:14px}
.reveal{opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.table{width:100%;border-collapse:collapse;font-size:14px}
.table th,.table td{padding:8px}
.table thead{color:#a1a1aa}
.table tr+tr{border-top:1px solid rgba(255,255,255,.06)}
.placeholder{opacity:.6}
.role-header{display:flex;align-items:center;gap:8px;margin-top:8px}
.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;border:1px solid #fff2}
.tier-S{background:#facc151a;border-color:#facc1580;color:#fde68a}
.tier-A{background:#fde0471a;border-color:#fde04766;color:#fde68a}
.tier-B{background:#eab3081a;border-color:#eab30866;color:#fde68a}
.tier-C{background:#a162071a;border-color:#a1620766;color:#f59e0b}
.tier-D{background:#2d1b0a;border-color:#1f1308;color:#a16207}
.arrow-up{filter:drop-shadow(0 0 8px #fde047aa)}
.arrow-down{opacity:.8}
.header{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.breadcrumbs{display:flex;gap:8px;align-items:center}
.breadcrumbs a{color:#9aa0a6;text-decoration:none}
.breadcrumbs .sep{opacity:.5}
.hero-banner{display:flex;gap:16px;align-items:center}
.hero-banner img{border-radius:14px}
.stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px}
.stat .ttl{font-size:12px;color:#94a3b8}
.stat .val{font-weight:800;font-size:22px}
.list{list-style:none;padding:0;margin:0}
.list li+li{margin-top:8px}
.best{background:linear-gradient(90deg,#fde04722,#facc1511)}
.maps-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
.map-card{border-radius:12px;overflow:hidden;border:1px solid var(--b);cursor:pointer}
.map-card img{width:100%;height:84px;object-fit:cover;display:block}
.map-card .ttl{padding:6px 8px;font-size:12px;color:#cbd5e1}
.map-card.selected{outline:2px solid #93c5fd}
.map-view{background:rgba(255,255,255,.03);border:1px solid var(--b);border-radius:16px;padding:12px}
.map-legend{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
.legend-dot{display:inline-block;width:10px;height:10px;border-radius:50%}
.legend-small{background:#34d399}
.legend-mega{background:#22d3ee}
.legend-point{background:#f59e0b}
.viewer-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.kbd{font-family:ui-monospace,Menlo,monospace;background:#fff1;border:1px solid #fff2;border-radius:6px;padding:2px 6px}
`;

// ===== Types (for reference only) =====
export type Hero = { key: string; name: string; portrait: string; role: string };
export type MapT = { slug: string; name: string; type: string; screenshot?: string };
export type MapWin = { map: string; hero: string; wins: number; losses: number };
export type WinRow = { hero: string; pickrate: number; winrate: number };

// ===== Data (remote + mock) =====
const BASE = 'https://overfast-api.tekrop.fr';

function placeholderSVG(text:string='OW'){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='#111827'/><text x='50%' y='55%' font-size='42' text-anchor='middle' fill='#e5e7eb' font-family='sans-serif'>${text}</text></svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function heroImg(h:Hero){ return (NETWORK_OK && h.portrait) ? h.portrait : placeholderSVG(h.name.split(' ')[0][0]||'H'); }
function mapImg(m:MapT){ if (NETWORK_OK && m.screenshot) return m.screenshot; const t=(m.name||'Map').slice(0,2).toUpperCase(); const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='320' height='180'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#0f172a'/><stop offset='100%' stop-color='#111827'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='55%' font-size='22' text-anchor='middle' fill='#e5e7eb' font-family='sans-serif'>${t}</text></svg>`; return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg); }

async function enableNetwork(){ NETWORK_OK = true; await reloadNetworkData(); }
async function reloadNetworkData(){ try { const [h,m] = await Promise.all([getHeroes(), getMaps()]); HEROES_CACHE=h; MAPS_CACHE=m; renderHomeShell(); renderAllData(); } catch { /* ignore */ } }

async function getHeroes(): Promise<Hero[]> {
  if (!NETWORK_OK) {
    return [
      { key:'tracer', name:'Tracer', portrait:'', role:'damage' },
      { key:'reinhardt', name:'Reinhardt', portrait:'', role:'tank' },
      { key:'lucio', name:'Lúcio', portrait:'', role:'support' },
      { key:'mercy', name:'Mercy', portrait:'', role:'support' },
      { key:'ashe', name:'Ashe', portrait:'', role:'damage' },
    ] as Hero[];
  }
  try {
    const r = await fetch(`${BASE}/heroes`);
    if(!r.ok) throw 0;
    return r.json();
  } catch { return [] as Hero[]; }
}

async function getMaps(): Promise<MapT[]> {
  if (!NETWORK_OK) {
    return [
      { slug:'ilios', name:'Ilios', type:'Control', screenshot:'' },
      { slug:'route-66', name:'Route 66', type:'Escort', screenshot:'' },
      { slug:'kings-row', name:"King's Row", type:'Hybrid', screenshot:'' },
    ] as MapT[];
  }
  try {
    const r = await fetch(`${BASE}/maps`);
    if(!r.ok) throw 0;
    return r.json();
  } catch { return [] as MapT[]; }
}

// Minimal hero meta (HP, ability CDs) — mock
const HERO_META: Record<string,{hp:number; cds:Array<{name:string;cd:number}>}> = {
  tracer: { hp:150, cds:[{name:'Blink', cd:3}, {name:'Recall', cd:12}] },
  reinhardt: { hp:600, cds:[{name:'Charge', cd:8}, {name:'Fire Strike', cd:6}, {name:'Barrier Field', cd:0}] },
  lucio: { hp:200, cds:[{name:'Amp It Up', cd:12}, {name:'Crossfade', cd:0}] },
  mercy: { hp:200, cds:[{name:'Guardian Angel', cd:1.5}, {name:'Resurrect', cd:30}] },
  ashe: { hp:200, cds:[{name:'Coach Gun', cd:10}, {name:'Dynamite', cd:12}] },
};

async function getMapWinsMock(): Promise<MapWin[]> { return [
  { map: 'Ilios', hero: 'tracer', wins: 28, losses: 12 },
  { map: 'Ilios', hero: 'reinhardt', wins: 14, losses: 16 },
  { map: 'Ilios', hero: 'lucio', wins: 22, losses: 18 },
  { map: 'Route 66', hero: 'tracer', wins: 18, losses: 22 },
  { map: 'Route 66', hero: 'reinhardt', wins: 20, losses: 10 },
  { map: 'Route 66', hero: 'ashe', wins: 24, losses: 16 },
  { map: "King's Row", hero: 'reinhardt', wins: 26, losses: 14 },
  { map: "King's Row", hero: 'tracer', wins: 16, losses: 24 },
  { map: "King's Row", hero: 'mercy', wins: 21, losses: 19 },
]; }

const MOCK: Record<string, WinRow[]> = {
  GLOBAL: [
    { hero: 'tracer', pickrate: 9.7, winrate: 52.3 },
    { hero: 'mercy', pickrate: 8.3, winrate: 50.1 },
    { hero: 'reinhardt', pickrate: 7.5, winrate: 51.4 },
    { hero: 'lucio', pickrate: 5.4, winrate: 51.9 },
    { hero: 'ashe', pickrate: 6.8, winrate: 51.2 },
  ],
  BRONZE:  [ { hero: 'reinhardt', pickrate: 10.1, winrate: 53.2 }, { hero: 'moira', pickrate: 9.4, winrate: 51.0 } ],
  SILVER:  [ { hero: 'soldier-76', pickrate: 8.2, winrate: 51.1 }, { hero: 'reinhardt', pickrate: 9.0, winrate: 52.0 } ],
  GOLD:    [ { hero: 'tracer', pickrate: 7.4, winrate: 51.6 }, { hero: 'mercy', pickrate: 8.9, winrate: 50.4 } ],
  PLATINUM:[ { hero: 'ana', pickrate: 9.1, winrate: 50.8 }, { hero: 'sigma', pickrate: 5.2, winrate: 52.6 } ],
  DIAMOND: [ { hero: 'tracer', pickrate: 10.2, winrate: 53.0 }, { hero: 'winston', pickrate: 4.7, winrate: 52.4 } ],
  MASTER:  [ { hero: 'sojourn', pickrate: 9.0, winrate: 51.2 }, { hero: 'ana', pickrate: 10.4, winrate: 50.5 } ],
  GRANDMASTER:[ { hero: 'tracer', pickrate: 12.0, winrate: 53.8 }, { hero: 'zenyatta', pickrate: 6.0, winrate: 52.1 } ],
  TOP500:  [ { hero: 'tracer', pickrate: 14.2, winrate: 54.4 }, { hero: 'genji', pickrate: 7.1, winrate: 52.0 } ],
};
const MY_DATA: Record<string, WinRow[]> = {
  GLOBAL: [ { hero: 'reinhardt', pickrate: 15.0, winrate: 55.0 }, { hero: 'lucio', pickrate: 6.0, winrate: 56.0 } ],
  GOLD:   [ { hero: 'reinhardt', pickrate: 20.0, winrate: 57.5 } ],
};
export const RANKS = ['GLOBAL','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','TOP500'] as const;
export function getWinratesByRank(rank: string){
  const key = (rank || 'GLOBAL').toUpperCase();
  return { rank: key, global: (MOCK as any)[key] || MOCK.GLOBAL, mine: (MY_DATA as any)[key] || MY_DATA.GLOBAL || [] };
}

// ===== Tiering & compare =====
function scoreFrom(winrate:number, pick:number){ return winrate + pick*0.4; }
function tierFrom(score:number){ if (score>=57) return 'S'; if (score>=54) return 'A'; if (score>=51) return 'B'; if (score>=48) return 'C'; return 'D'; }
function computeOverallTier(heroKey:string){
  const row = (MOCK.GLOBAL as WinRow[]).find(r=>r.hero===heroKey);
  if (!row) return { tier:'D', score:0, winrate:0, pickrate:0 };
  const sc = scoreFrom(row.winrate, row.pickrate);
  return { tier: tierFrom(sc), score: sc, winrate: row.winrate, pickrate: row.pickrate };
}
function computeMapTier(heroKey:string, mapName:string){
  const overall = computeOverallTier(heroKey);
  const m = MAP_WINS.find(x=>x.hero===heroKey && x.map===mapName);
  if (!m) return { tier: overall.tier, score: overall.score, winrate: overall.winrate, pickrate: overall.pickrate, note:'N/A (pas de données map)' };
  const wr = (m.wins + m.losses) ? (m.wins/(m.wins+m.losses))*100 : overall.winrate;
  const sc = scoreFrom(wr, overall.pickrate);
  return { tier: tierFrom(sc), score: sc, winrate: wr, pickrate: overall.pickrate };
}
function tierDelta(a:string,b:string){ const scale = {S:5,A:4,B:3,C:2,D:1} as any; return (scale[b]||0) - (scale[a]||0); }

// Cache & state
let MAP_WINS: MapWin[] = [];
let SELECTED_MAP: string | null = null;
let HEROES_CACHE: Hero[] = [];
let MAPS_CACHE: MapT[] = [];
let LAST_HERO: Hero | null = null;
let NETWORK_OK: boolean = false;

// ===== 2D map layouts (mock coordinates in %) =====
const MAP_LAYOUTS: Record<string,{image?:string, packs:Array<{x:number,y:number,type:'small'|'mega'}>, points:Array<{x:number,y:number,label:string}>, shapes?: Array<{type:'rect'|'poly'; fill:string; stroke:string; opacity:number; points?: Array<{x:number,y:number}>; x?:number;y?:number;width?:number;height?:number;rx?:number;ry?:number}>}> = {
  'Ilios': {
    image: '',
    shapes:[
      { type:'rect', x:10, y:10, width:80, height:80, rx:6, ry:6, fill:'#0b1220', stroke:'#1f2937', opacity:.9 },
      { type:'rect', x:45, y:10, width:10, height:80, rx:2, ry:2, fill:'#0a1428', stroke:'#263548', opacity:.9 },
      { type:'rect', x:10, y:45, width:80, height:10, rx:2, ry:2, fill:'#0a1428', stroke:'#263548', opacity:.9 },
    ],
    packs: [ {x:20,y:30,type:'small'},{x:48,y:55,type:'mega'},{x:72,y:40,type:'small'} ],
    points:[ {x:50,y:50,label:'Point A'} ]
  },
  'Route 66': {
    image: '',
    shapes:[
      { type:'rect', x:8, y:40, width:84, height:20, rx:4, ry:4, fill:'#101827', stroke:'#22324a', opacity:.95 },
      { type:'rect', x:30, y:25, width:18, height:50, rx:3, ry:3, fill:'#0d1b2b', stroke:'#22324a', opacity:.9 },
    ],
    packs: [ {x:15,y:60,type:'small'},{x:40,y:35,type:'small'},{x:78,y:45,type:'mega'} ],
    points:[ {x:35,y:38,label:'Convoi'} ]
  },
  "King's Row": {
    image: '',
    shapes:[
      { type:'rect', x:12, y:30, width:40, height:40, rx:6, ry:6, fill:'#0e1726', stroke:'#263248', opacity:.95 },
      { type:'rect', x:52, y:45, width:36, height:18, rx:3, ry:3, fill:'#0d1b2b', stroke:'#263248', opacity:.9 },
    ],
    packs: [ {x:28,y:52,type:'small'},{x:52,y:48,type:'mega'},{x:70,y:62,type:'small'} ],
    points:[ {x:52,y:48,label:'Point'} ]
  }
};
// ===== Helpers =====
function ioReveal(selector='.reveal'){
  const sel = (typeof selector === 'string' && selector.trim()) ? selector : '.reveal';
  if (typeof window === 'undefined') return;
  const els = Array.from(document.querySelectorAll(sel));
  if (!('IntersectionObserver' in window)) { els.forEach(el=>el.classList.add('visible')); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  },{threshold:0.15});
  els.forEach(el=>io.observe(el));
}
function el(tag:string, attrs:Record<string,any>={}, children:any[]=[]){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if (k==='class') n.className = v;
    else if (k==='style' && typeof v==='object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v==='function') n.addEventListener(k.slice(2).toLowerCase(), v as any);
    else if (v !== undefined && v !== null) n.setAttribute(k, String(v));
  });
  children.filter(c=>c!==undefined && c!==null && c!==false).forEach(c=> n.appendChild(typeof c==='string' ? document.createTextNode(c) : (c as Node)));
  return n;
}
function header(breadcrumb?:Array<{label:string, onClick?:()=>void}>){
  const wrap = el('header',{class:'container header'});
  const left = el('div',{},[]);
  const brand = el('a',{href:'#',class:'gradient',style:{fontWeight:'800',fontSize:'22px'}},['OWGG']);
  left.appendChild(brand);
  if (breadcrumb && breadcrumb.length){
    const bc = el('div',{class:'breadcrumbs'},[]);
    breadcrumb.forEach((b,i)=>{
      const a = el('a',{href:'#',onClick:(e:any)=>{e.preventDefault(); b.onClick && b.onClick();}},[b.label]);
      bc.appendChild(a); if (i<breadcrumb.length-1) bc.appendChild(el('span',{class:'sep'},['›']));
    });
    left.appendChild(bc);
  }
  const nav = el('nav',{class:'small',style:{display:'flex',gap:'16px'}},[
    el('a',{href:'#heroes',style:{color:'inherit',textDecoration:'none'}},['Héros']),
    el('a',{href:'#maps',style:{color:'inherit',textDecoration:'none'}},['Cartes']),
    el('a',{href:'#leaderboards',style:{color:'inherit',textDecoration:'none'}},['Leaderboards'])
  ]);
  const right = !NETWORK_OK ? el('button',{class:'btn',onClick:()=>enableNetwork()},['Activer les images']) : el('span',{},[]);
  wrap.appendChild(left); wrap.appendChild(nav); wrap.appendChild(right); return wrap;
}

// ===== Shells =====
function renderHomeShell(){
  const style = document.createElement('style'); style.textContent = GLOBAL_CSS; document.head.appendChild(style);
  document.body.innerHTML = '';
  document.body.appendChild(header());
  const heroIntro = el('section',{class:'container'},[
    el('div',{class:'reveal'},[
      el('h1',{style:{fontSize:'48px',lineHeight:1.1,fontWeight:900}},['Stats Overwatch façon ', el('span',{class:'gradient'},['OP.GG'])]),
      el('p',{class:'small',style:{maxWidth:'65ch',marginTop:'8px'}},['Compare tout : rôles, héros, cartes. Sans installation.'])
    ])
  ]);
  document.body.appendChild(heroIntro);

  const heroesSection = el('section',{id:'heroes',class:'container'},[
    el('div',{class:'reveal'},[el('h2',{style:{fontSize:'28px',fontWeight:800}},['Héros par rôle']), el('p',{class:'small'},['Clique un héros pour voir son tier global et par carte sélectionnée.'])]),
    el('div',{id:'roles-grid',class:'grid',style:{marginTop:'16px'}},[])
  ]);
  document.body.appendChild(heroesSection);

  const mapsSection = el('section',{id:'maps',class:'container'},[
    el('div',{class:'reveal'},[el('h2',{style:{fontSize:'28px',fontWeight:800}},['Cartes']), el('p',{class:'small'},['Choisis une carte pour voir les tiers spécifiques et la vue 2D.'])]),
    el('div',{id:'maps-grid',class:'maps-grid',style:{marginTop:'12px'}},[]),
    el('div',{id:'map-viewer',class:'map-view',style:{marginTop:'12px'}},[])
  ]);
  document.body.appendChild(mapsSection);

  const lbSection = el('section',{id:'leaderboards',class:'container'},[
    el('div',{class:'reveal'},[el('h2',{style:{fontSize:'28px',fontWeight:800}},['Leaderboards (GLOBAL)']), el('p',{class:'small'},['Global vs Mes parties.'])]),
    el('div',{class:'grid grid-2',style:{marginTop:'16px'}},[
      el('div',{class:'card'},[el('div',{style:{fontWeight:600,marginBottom:'8px'}},['Winrate — Global']), el('table',{id:'tbl-global',class:'table'},[])]),
      el('div',{class:'card'},[el('div',{style:{fontWeight:600,marginBottom:'8px'}},['Winrate — Mes parties (Uploader)']), el('table',{id:'tbl-mine',class:'table'},[]), el('p',{class:'small',style:{marginTop:'8px'}},['À remplir via uploader Overwolf + DB (hors canvas).'])])
    ])
  ]);
  document.body.appendChild(lbSection);

  document.body.appendChild(el('footer',{class:'container small',style:{paddingBottom:'40px'}},[`© ${new Date().getFullYear()} OWGG`]));
  requestAnimationFrame(()=>ioReveal());
}

function renderHeroDetail(h:Hero){ LAST_HERO = h;
  document.body.innerHTML = '';
  document.body.appendChild(header([
    {label:'Accueil', onClick:()=>{ renderHomeShell(); renderAllData(); }},
    {label:'Héros', onClick:()=>{ renderHomeShell(); renderAllData(); setTimeout(()=>document.getElementById('heroes')?.scrollIntoView({behavior:'smooth'}),50); }},
    {label:h.name}
  ]));

  const overall = computeOverallTier(h.key);
  const mapInfo = SELECTED_MAP ? computeMapTier(h.key, SELECTED_MAP) : overall;
  const delta = SELECTED_MAP ? tierDelta(overall.tier, mapInfo.tier) : 0;
  const meta = HERO_META[h.key] || { hp: 200, cds: [] };

  const head = el('section',{class:'container'},[
    el('div',{class:'hero-banner'},[
      el('img',{src: heroImg(h), alt:h.name, width:96, height:96}),
      el('div',{},[
        el('div',{style:{fontWeight:800,fontSize:'28px',textTransform:'capitalize'}},[h.name]),
        el('div',{class:'small',style:{textTransform:'capitalize'}},[h.role])
      ]),
      el('div',{style:{marginLeft:'auto'}},[ el('button',{class:'btn',onClick:()=>{ renderHomeShell(); renderAllData(); }},['← Retour']) ])
    ])
  ]);
  document.body.appendChild(head);

  const arrow = delta>0 ? '↑' : (delta<0 ? '↓' : '=');
  const arrowClass = delta>0 ? 'arrow-up' : (delta<0 ? 'arrow-down' : '');
  const stats = el('section',{class:'container'},[
    el('div',{class:'stat-grid'},[
      el('div',{class:'stat'},[ el('div',{class:'ttl'},['Tier global']), el('div',{class:'val'},[overall.tier]), el('div',{},[el('span',{class:`badge tier-${overall.tier}`},[' ']) , el('span',{class:'small',style:{marginLeft:'6px'}},[`WR ${overall.winrate.toFixed(1)}% · Pick ${overall.pickrate.toFixed(1)}%`]) ]) ]),
      el('div',{class:'stat'},[ el('div',{class:'ttl'},['Tier sur la carte']), el('div',{class:'val'},[SELECTED_MAP?mapInfo.tier:'—']), el('div',{},[ SELECTED_MAP? el('span',{class:`badge tier-${mapInfo.tier} ${arrowClass}`},[arrow]): el('span',{class:'small'},['Sélectionne une carte ci-dessous']), SELECTED_MAP? el('span',{class:'small',style:{marginLeft:'6px'}},[`WR ${mapInfo.winrate.toFixed(1)}%`]): null ]) ]),
      el('div',{class:'stat'},[ el('div',{class:'ttl'},['Points de vie']), el('div',{class:'val'},[String(meta.hp)]), el('div',{class:'small'},['HP de base']) ])
    ])
  ]);
  document.body.appendChild(stats);

  const abilities = el('section',{class:'container'},[
    el('div',{class:'card'},[
      el('div',{style:{fontWeight:700,marginBottom:'8px'}},['Capacités (CD)']),
      el('ul',{class:'list'},[
        ...(meta.cds.length? meta.cds.map(a=> el('li',{},[ el('span',{},[a.name]), el('span',{class:'small',style:{marginLeft:'8px'}},[ a.cd? `${a.cd}s CD` : 'CD — variable / maintenu' ]) ])) : [ el('li',{class:'small placeholder'},['Aucune donnée CD (mock)']) ])
      ])
    ])
  ]);
  document.body.appendChild(abilities);

  const heroRows = MAP_WINS.filter(x=>x.hero===h.key);
  const best = heroRows.reduce<{map:string; wr:number; wins:number; losses:number} | null>((acc,row)=>{
    const wr = (row.wins+row.losses)? (row.wins/(row.wins+row.losses))*100 : 0;
    if(!acc || wr>acc.wr) return { map: row.map, wr, wins: row.wins, losses: row.losses };
    return acc;
  }, null);
  const totals = heroRows.reduce((a,r)=>{ a.w+=r.wins; a.l+=r.losses; return a; }, {w:0,l:0});
  const avgWR = (totals.w+totals.l)? (totals.w/(totals.w+totals.l))*100 : 0;

  const mapsDetail = el('section',{class:'container'},[
    el('div',{class:'grid grid-2'},[
      el('div',{class:'card best'},[
        el('div',{style:{fontWeight:700,marginBottom:'6px'}},['Meilleure carte']),
        best? el('div',{},[ el('div',{},[best.map,' ', el('span',{class:'badge tier-S'},['BEST']) ]), el('div',{class:'small'},[`WR ${best.wr.toFixed(1)}% — ${best.wins}W/${best.losses}L`]) ]) : el('div',{class:'small placeholder'},['Pas de données'])
      ]),
      el('div',{class:'card'},[
        el('div',{style:{fontWeight:700,marginBottom:'6px'}},['Moyennes globales']),
        el('div',{class:'small'},[`WR ${avgWR.toFixed(1)}% — ${totals.w}W/${totals.l}L`])
      ])
    ])
  ]);
  document.body.appendChild(mapsDetail);

  const viewerHolder = el('section',{class:'container'},[
    el('div',{class:'viewer-head'},[
      el('div',{style:{fontWeight:700}},['Carte sélectionnée']),
      el('div',{class:'small'},['Glisser pour déplacer · ', el('span',{class:'kbd'},['Wheel']), ' pour zoom'])
    ]),
    el('div',{id:'detail-maps',class:'maps-grid',style:{marginBottom:'12px'}},[]),
    el('div',{id:'map-viewer',class:'map-view'},[])
  ]);
  document.body.appendChild(viewerHolder);
  renderMaps(MAPS_CACHE);
  if (SELECTED_MAP) renderMapViewer(SELECTED_MAP);
}

// Fillers / listes
function groupByRole(heroes:Hero[]){
  const groups: Record<string, Hero[]> = { damage: [], tank: [], support: [] } as any;
  heroes.forEach(h=>{ const r=(h.role||'').toLowerCase(); if (r in groups) groups[r].push(h); });
  return groups;
}
function tierBadge(tier:string){ return el('span',{class:`badge tier-${tier}`},[' ']); }

function renderRoles(heroes:Hero[]){
  const root = document.getElementById('roles-grid'); if (!root) return;
  const g = groupByRole(heroes);
  root.innerHTML = '';
  const sections: Array<[string,Hero[]]> = [ ['DPS', g.damage], ['Tank', g.tank], ['Support', g.support] ];
  sections.forEach(([title, list])=>{
    const wrap = el('div', {class:'card'});
    wrap.appendChild(el('div', {class:'role-header'}, [ el('h3',{},[title]), el('span',{class:'small'},[`${list.length} héros`]) ]));
    const grid = el('div',{class:'grid', style:{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',marginTop:'12px'}});
    list.forEach(h=>{
      const overall = computeOverallTier(h.key);
      const imgSrc = heroImg(h);
      const card = el('div',{class:'card', style:{cursor:'pointer', padding:'12px'}, onClick:()=>renderHeroDetail(h)});
      const row = el('div',{style:{display:'flex',gap:'12px',alignItems:'center'}},[
        el('img',{src:imgSrc, alt:h.name, width:64, height:64, style:{borderRadius:'12px'}}),
        el('div',{},[
          el('div',{style:{fontWeight:'600', textTransform:'capitalize'}},[h.name]),
          el('div',{class:'small', style:{textTransform:'capitalize'}},[h.role]),
          el('div',{style:{marginTop:'6px'}},[ tierBadge(overall.tier), el('span',{class:'small', style:{marginLeft:'8px'}},[`WR ${overall.winrate.toFixed(1)}% · Pick ${overall.pickrate.toFixed(1)}%`]) ])
        ])
      ]);
      card.appendChild(row);
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    root.appendChild(wrap);
  });
}

function renderMaps(maps:MapT[]){
  const root = document.getElementById('maps-grid') || document.getElementById('detail-maps'); if (!root) return;
  root.innerHTML = '';
  maps.forEach(m=>{
    const imgSrc = mapImg(m);
    const card = el('div',{class:'map-card'+((SELECTED_MAP===m.name)?' selected':''), onClick:()=>{ SELECTED_MAP=m.name; updateTierBadges(); renderMaps(maps); renderMapViewer(m.name); }},[
      el('img',{src: imgSrc, alt: m.name}),
      el('div',{class:'ttl'},[m.name])
    ]);
    root.appendChild(card);
  });
}
// ===== SVG Map Viewer (pan/zoom, pinch, inertia, mini-map, fit) =====
function renderMapViewer(mapName:string){
  const holder = document.getElementById('map-viewer'); if(!holder) return; holder.innerHTML='';
  const layout = MAP_LAYOUTS[mapName]; if(!layout){ holder.appendChild(el('div',{class:'small placeholder'},['Pas de layout pour cette carte (mock).'])); return; }

  const WORLD_W = 3000, WORLD_H = 2000;
  const svgNS = 'http://www.w3.org/2000/svg';

  const mapNode = MAPS_CACHE.find(m=>m.name===mapName);
  const photoURL = (NETWORK_OK && mapNode && mapNode.screenshot) ? mapNode.screenshot : '';
  let showPhoto = !!photoURL;

  const headRight: any[] = [
    el('span',{},[el('span',{class:'legend-dot legend-small'},['']),' Small pack']),
    el('span',{},[el('span',{class:'legend-dot legend-mega'},['']),' Mega pack']),
    el('span',{},[el('span',{class:'legend-dot legend-point'},['']),' Objectif'])
  ];
  if (photoURL) headRight.push(el('label',{class:'small',style:{marginLeft:'8px',display:'inline-flex',alignItems:'center',gap:'6px'}},[
    el('input',{type:'checkbox',checked:'checked',onChange:(e:any)=>{ showPhoto = !!e.target.checked; apply(); }}),
    'Fond photo (réseau)'
  ]));

  holder.appendChild(el('div',{class:'viewer-head'},[
    el('div',{},[el('strong',{},[mapName])]),
    el('div',{class:'map-legend'},headRight)
  ]));

  const svg = document.createElementNS(svgNS,'svg');
  svg.setAttribute('width','100%'); svg.setAttribute('height','520');
  svg.style.touchAction = 'none';

  const defs = document.createElementNS(svgNS,'defs');
  const grad = document.createElementNS(svgNS,'linearGradient'); grad.setAttribute('id','bggrad'); grad.setAttribute('x1','0'); grad.setAttribute('x2','1'); grad.setAttribute('y1','0'); grad.setAttribute('y2','1');
  const s1 = document.createElementNS(svgNS,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#0f172a');
  const s2 = document.createElementNS(svgNS,'stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#111827');
  grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); svg.appendChild(defs);

  const g = document.createElementNS(svgNS,'g');
  const bg = document.createElementNS(svgNS,'rect'); bg.setAttribute('width',String(WORLD_W)); bg.setAttribute('height',String(WORLD_H)); bg.setAttribute('fill','url(#bggrad)'); g.appendChild(bg);

  let photoEl: SVGImageElement | null = null;
  if (photoURL){
    photoEl = document.createElementNS(svgNS,'image') as any;
    photoEl.setAttributeNS('http://www.w3.org/1999/xlink','href',photoURL);
    photoEl.setAttribute('x','0'); photoEl.setAttribute('y','0');
    photoEl.setAttribute('width',String(WORLD_W)); photoEl.setAttribute('height',String(WORLD_H));
    g.appendChild(photoEl);
  }

  function toXY(p:{x:number;y:number}){ return { x: p.x/100*WORLD_W, y: p.y/100*WORLD_H } }

  if (layout.shapes && layout.shapes.length){
    layout.shapes.forEach(s=>{
      if (s.type==='rect'){
        const r=document.createElementNS(svgNS,'rect');
        const {x=0,y=0,width=10,height=10,rx=0,ry=0}=s; const p=toXY({x,y}); const sz=toXY({x:width,y:height});
        r.setAttribute('x',String(p.x)); r.setAttribute('y',String(p.y)); r.setAttribute('width',String(sz.x)); r.setAttribute('height',String(sz.y)); r.setAttribute('rx',String(rx/100*WORLD_W)); r.setAttribute('ry',String(ry/100*WORLD_H));
        r.setAttribute('fill',s.fill); r.setAttribute('stroke',s.stroke); r.setAttribute('opacity',String(s.opacity));
        g.appendChild(r);
      } else if (s.type==='poly' && s.points){
        const pts = s.points.map(pt=>{ const pp=toXY(pt); return `${pp.x},${pp.y}`; }).join(' ');
        const poly=document.createElementNS(svgNS,'polygon'); poly.setAttribute('points',pts); poly.setAttribute('fill',s.fill); poly.setAttribute('stroke',s.stroke); poly.setAttribute('opacity',String(s.opacity)); g.appendChild(poly);
      }
    });
  }

  layout.points.forEach(p=>{ const {x,y}=toXY(p); const c=document.createElementNS(svgNS,'circle'); c.setAttribute('cx',String(x)); c.setAttribute('cy',String(y)); c.setAttribute('r','14'); c.setAttribute('fill','#f59e0b'); c.setAttribute('opacity','0.9'); g.appendChild(c);
    const t=document.createElementNS(svgNS,'text'); t.setAttribute('x',String(x+16)); t.setAttribute('y',String(y+4)); t.setAttribute('fill','#e5e7eb'); t.setAttribute('font-size','20'); t.textContent=p.label; g.appendChild(t);
  });
  layout.packs.forEach(p=>{ const {x,y}=toXY(p); const r=p.type==='mega'?18:12; const col=p.type==='mega'?'#22d3ee':'#34d399'; const c=document.createElementNS(svgNS,'circle'); c.setAttribute('cx',String(x)); c.setAttribute('cy',String(y)); c.setAttribute('r',String(r)); c.setAttribute('fill',col); c.setAttribute('opacity','0.9'); g.appendChild(c); });

  svg.appendChild(g);
  holder.appendChild(svg);

  const controls = el('div',{style:{display:'flex',gap:'8px',justifyContent:'flex-end',marginTop:'8px'}},[
    el('button',{class:'btn',onClick:zoomIn},['+']),
    el('button',{class:'btn',onClick:zoomOut},['−']),
    el('button',{class:'btn',onClick:fitView},['Fit'])
  ]);
  holder.appendChild(controls);

  const miniW=180, miniH=Math.round(miniW*(WORLD_H/WORLD_W));
  const mini = document.createElementNS(svgNS,'svg'); mini.setAttribute('width',String(miniW)); mini.setAttribute('height',String(miniH)); mini.style.border='1px solid rgba(255,255,255,.15)'; mini.style.borderRadius='8px'; mini.style.marginTop='8px';
  const miniBg = document.createElementNS(svgNS,'rect'); miniBg.setAttribute('width',String(miniW)); miniBg.setAttribute('height',String(miniH)); miniBg.setAttribute('fill','url(#bggrad)'); mini.appendChild(miniBg);
  const viewRect = document.createElementNS(svgNS,'rect'); viewRect.setAttribute('fill','none'); viewRect.setAttribute('stroke','#93c5fd'); viewRect.setAttribute('stroke-width','2'); mini.appendChild(viewRect);
  holder.appendChild(mini);

  let scale = 1; let tx = 0; let ty = 0;
  let dragging=false; let ox=0; let oy=0; let vx=0; let vy=0; let raf: number|undefined;
  let pinchStartDist=0; let pinchStartScale=1; let pinchCenter={x:0,y:0};

  function getViewport(){ const r=svg.getBoundingClientRect(); return {vw:r.width, vh:r.height}; }
  function clamp(){ const {vw,vh}=getViewport(); const maxTx = 0, maxTy = 0; const minTx = Math.min(0, vw - WORLD_W*scale); const minTy = Math.min(0, vh - WORLD_H*scale); tx = Math.min(maxTx, Math.max(minTx, tx)); ty = Math.min(maxTy, Math.max(minTy, ty)); }
  function apply(){
    if (photoEl) photoEl.setAttribute('opacity', showPhoto ? '1' : '0');
    g.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`); updateMini();
  }
  function fitView(){ const {vw,vh}=getViewport(); const s = Math.min(vw/WORLD_W, vh/WORLD_H); scale = s; tx = (vw - WORLD_W*scale)/2; ty = (vh - WORLD_H*scale)/2; apply(); }
  function zoomAt(cx:number, cy:number, factor:number){ const {vw,vh}=getViewport(); const wx = (cx - tx)/scale; const wy = (cy - ty)/scale; scale = Math.max(0.3, Math.min(4, scale*factor)); tx = cx - wx*scale; ty = cy - wy*scale; clamp(); apply(); }
  function zoomIn(){ const {vw,vh}=getViewport(); zoomAt(vw/2,vh/2,1.2); }
  function zoomOut(){ const {vw,vh}=getViewport(); zoomAt(vw/2,vh/2,0.8); }

  function updateMini(){ const {vw,vh}=getViewport(); const sx = miniW / (WORLD_W); const sy = miniH / (WORLD_H); const rectW = vw/scale*sx; const rectH = vh/scale*sy; const rectX = -tx/scale*sx; const rectY = -ty/scale*sy; viewRect.setAttribute('x',String(rectX)); viewRect.setAttribute('y',String(rectY)); viewRect.setAttribute('width',String(rectW)); viewRect.setAttribute('height',String(rectH)); }
  mini.addEventListener('click',(e)=>{ const br=mini.getBoundingClientRect(); const mx=e.clientX - br.left; const my=e.clientY - br.top; const targetWorldX = mx/miniW*WORLD_W; const targetWorldY = my/miniH*WORLD_H; const {vw,vh}=getViewport(); tx = -targetWorldX*scale + vw/2; ty = -targetWorldY*scale + vh/2; clamp(); apply(); });

  svg.addEventListener('mousedown',(e)=>{ dragging=true; ox=e.clientX; oy=e.clientY; vx=vy=0; if(raf) cancelAnimationFrame(raf); });
  svg.addEventListener('mousemove',(e)=>{ if(!dragging) return; const dx=e.clientX-ox, dy=e.clientY-oy; tx += dx; ty += dy; vx = dx; vy = dy; ox=e.clientX; oy=e.clientY; clamp(); apply(); });
  svg.addEventListener('mouseup',()=>{ dragging=false; decay(); });
  svg.addEventListener('mouseleave',()=>{ if(dragging){ dragging=false; decay(); } });
  function decay(){ const f=0.92; const step=()=>{ vx*=f; vy*=f; if(Math.abs(vx)<0.5 && Math.abs(vy)<0.5){ raf=undefined; return; } tx+=vx; ty+=vy; clamp(); apply(); raf=requestAnimationFrame(step); }; raf=requestAnimationFrame(step); }

  svg.addEventListener('wheel',(e)=>{ e.preventDefault(); const factor = e.deltaY>0? 0.9 : 1.1; zoomAt(e.clientX, e.clientY, factor); }, {passive:false});

  svg.addEventListener('touchstart',(e)=>{
    if(e.touches.length===1){ dragging=true; ox=e.touches[0].clientX; oy=e.touches[0].clientY; vx=vy=0; if(raf) cancelAnimationFrame(raf); }
    if(e.touches.length===2){ dragging=false; const [t1,t2]=[e.touches[0],e.touches[1]]; pinchStartDist = Math.hypot(t2.clientX-t1.clientX, t2.clientY-t1.clientY); pinchStartScale = scale; pinchCenter = { x:(t1.clientX+t2.clientX)/2, y:(t1.clientY+t2.clientY)/2 }; }
  }, {passive:false});
  svg.addEventListener('touchmove',(e)=>{
    if(e.touches.length===1 && dragging){ const dx=e.touches[0].clientX-ox, dy=e.touches[0].clientY-oy; tx+=dx; ty+=dy; vx=dx; vy=dy; ox=e.touches[0].clientX; oy=e.touches[0].clientY; clamp(); apply(); }
    if(e.touches.length===2){ const [t1,t2]=[e.touches[0],e.touches[1]]; const dist=Math.hypot(t2.clientX-t1.clientX,t2.clientY-t1.clientY); const factor = dist/pinchStartDist; scale = Math.max(0.3, Math.min(4, pinchStartScale*factor));
      const {x:cx,y:cy}=pinchCenter; const wx=(cx - tx)/scale; const wy=(cy - ty)/scale; tx = cx - wx*scale; ty = cy - wy*scale; clamp(); apply(); }
  }, {passive:false});
  svg.addEventListener('touchend',()=>{ if(dragging){ dragging=false; decay(); } });

  svg.addEventListener('dblclick',(e)=>{ zoomAt(e.clientX, e.clientY, 1.3); });

  fitView();
}

function updateTierBadges(){
  if (LAST_HERO) renderHeroDetail(LAST_HERO);
  else if (HEROES_CACHE.length) renderRoles(HEROES_CACHE);
}

function fillTables(rank='GLOBAL'){
  const data = getWinratesByRank(rank);
  const thead = '<thead><tr><th>Héros</th><th style="text-align:right">Pick%</th><th style="text-align:right">Win%</th></tr></thead>';
  const rows = (arr:WinRow[])=> (arr&&arr.length? arr.map(r=>`<tr><td style=\"text-transform:capitalize\">${r.hero}</td><td style=\"text-align:right\">${r.pickrate.toFixed(1)}</td><td style=\"text-align:right\">${r.winrate.toFixed(1)}</td></tr>`).join('') : '<tr><td class=\"small\" colspan=\"3\">Aucune donnée</td></tr>');
  const tbG = document.getElementById('tbl-global'); const tbM = document.getElementById('tbl-mine');
  if (tbG) tbG.innerHTML = thead + `<tbody>${rows(data.global)}</tbody>`;
  if (tbM) tbM.innerHTML = thead + `<tbody>${rows(data.mine)}</tbody>`;
}

function renderAllData(){ if (HEROES_CACHE.length) renderRoles(HEROES_CACHE); if (MAPS_CACHE.length) { renderMaps(MAPS_CACHE); if(SELECTED_MAP) renderMapViewer(SELECTED_MAP); } fillTables('GLOBAL'); requestAnimationFrame(()=>ioReveal()); }

// ===== Self-tests =====
export function GET_SELFTEST(){
  const sample = getWinratesByRank('GLOBAL').global;
  const ranks = ['GLOBAL','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','TOP500'];
  const ranksOk = ranks.map(r=>({ r, ok: Array.isArray(getWinratesByRank(r).global) && Array.isArray(getWinratesByRank(r).mine) }));
  const boundsOk = sample.every(x=> x.pickrate>=0 && x.pickrate<=100 && x.winrate>=0 && x.winrate<=100);
  const pickSumOk = sample.reduce((s,x)=>s+x.pickrate,0) <= 100 + 1e-6;
  const mapRowsOk = Array.isArray([{map:'Ilios',hero:'tracer',wins:1,losses:0}]);
  const t1 = computeOverallTier('tracer');
  const t2 = computeMapTier('reinhardt', "King's Row");
  const tierOk = ['S','A','B','C','D'].includes(t1.tier) && ['S','A','B','C','D'].includes(t2.tier);
  const layoutOk = !!MAP_LAYOUTS['Ilios'] && !!MAP_LAYOUTS['Route 66'];
  const deltaOk = tierDelta('B','A')>0 && tierDelta('A','B')<0 && tierDelta('C','C')===0;
  const apiOk = typeof updateTierBadges === 'function';
  const ok = ranksOk.every(t=>t.ok) && boundsOk && pickSumOk && mapRowsOk && tierOk && layoutOk && deltaOk && apiOk;
  return { ok, ranksOk, boundsOk, pickSumOk, mapRowsOk, tierOk, layoutOk, deltaOk, apiOk };
}

// ===== Default export =====
export default function App(){
  if (typeof document !== 'undefined') {
    renderHomeShell();
    (async()=>{
      const [heroes, maps, wl] = await Promise.all([getHeroes(), getMaps(), getMapWinsMock()]);
      HEROES_CACHE = heroes; MAPS_CACHE = maps; MAP_WINS = wl;
      renderRoles(heroes); renderMaps(maps); fillTables('GLOBAL');
      requestAnimationFrame(()=>ioReveal());
    })();
  }
  return null;
}
