// src/app.ts
import {
  HEROES, MAPS,
  generateTierData, generateMatches,
  fmtPct, fmtDelta,
  computeTierLetter,
  HERO_ICON, MAP_THUMB,
  Hero, MapInfo, MatchItem, TierRow
} from './stats';
import { setBgWithFallback } from './imgFallback';

// ———————————————————————————————
// CSS minimal injecté pour assurer le rendu
// (si tu as déjà un fichier CSS, tu peux supprimer ce bloc)
const CSS = `
:root{
  --bg:#0b0c10; --card:#12141a; --muted:#1b1e26; --text:#e6e9ef;
  --sub:#a3aab9; --blue:#3aa1ff; --red:#ff5b6a; --green:#30d158;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
a{color:inherit}
.container{max-width:960px;margin:0 auto;padding:16px}
.h1{font-size:32px;font-weight:800;letter-spacing:.3px;margin:8px 0 20px}
.badge{padding:2px 8px;border-radius:999px;background:rgba(255,255,255,.08);font-size:12px}
.row{display:flex;gap:12px;flex-wrap:wrap}
.card{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:16px}
.section{padding:16px 18px}

.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:12px 10px;border-top:1px solid rgba(255,255,255,.06)}
.table thead th{color:var(--sub);font-weight:600;text-align:left;border-top:none}

.tier-pill{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:#243; font-weight:700}
.tier-a{background:#13391f;color:#8fffab} .tier-b{background:#11283d;color:#8fd2ff}
.tier-c{background:#3a2c12;color:#ffd38a} .tier-d{background:#3a1212;color:#ff9e9e} .tier-s{background:#1a2b3a;color:#9fe3ff}

.kpi{display:flex;gap:18px;align-items:baseline}
.kpi .big{font-size:20px;font-weight:700}
.kpi .delta-up{color:var(--green);font-size:14px}
.kpi .delta-down{color:var(--red);font-size:14px}

.hero-chip{display:inline-flex;align-items:center;gap:10px}
.hero-chip img{width:28px;height:28px;border-radius:6px;object-fit:cover;border:1px solid rgba(255,255,255,.12)}

.synergy-col{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.synergy-pill{padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.1);font-size:13px}
.synergy-pos{border-color:rgba(48,209,88,.35);color:#9ff5b6}
.synergy-neg{border-color:rgba(255,91,106,.35);color:#ffb3bb}

.feed{display:flex;flex-direction:column;gap:14px;margin-top:10px}
.match{position:relative;overflow:hidden;padding:16px;border-radius:16px;border:2px solid transparent}
.match.win{border-color:rgba(58,161,255,.7)} .match.loss{border-color:rgba(255,91,106,.7)}
.match .bg{position:absolute;inset:0;background-position:center;background-size:cover;filter:brightness(.55) saturate(1.05);transform:scale(1.02)}
.match .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.5))}
.match .content{position:relative;display:flex;gap:14px;align-items:center}
.match .left{display:flex;align-items:center;gap:12px;min-width:0}
.match .hero{width:54px;height:54px;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.18);background:#000}
.match .hero img{width:100%;height:100%;object-fit:cover}
.match .meta{display:flex;flex-direction:column;gap:4px;min-width:0}
.match .title{font-weight:800;font-size:18px}
.match .sub{color:var(--sub);font-size:14px}
.match .kda{color:#dfe6f3;font-size:13px}
.match .right{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.match .result{padding:4px 10px;border-radius:999px;font-weight:700;background:rgba(0,0,0,.35)}
.match.win .result{color:#b9dcff;border:1px solid rgba(58,161,255,.6)}
.match.loss .result{color:#ffd0d5;border:1px solid rgba(255,91,106,.6)}
.footer{margin-top:22px;color:var(--sub);font-size:12px;text-align:center}
`;
(function injectCSS() {
  if (document.getElementById('owgg-css')) return;
  const s = document.createElement('style');
  s.id = 'owgg-css'; s.textContent = CSS;
  document.head.appendChild(s);
})();
// ———————————————————————————————

type State = {
  rank: 'Platinum';     // tu peux rendre dynamique plus tard
  mapId: 'all' | string;
  role: 'All' | 'Tank' | 'DPS' | 'Support';
};

const state: State = { rank:'Platinum', mapId:'all', role:'All' };

// Cache pour éviter de régénérer à chaque fois
let TIER_ROWS: TierRow[] = [];
let MATCHES: MatchItem[] = [];

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls?: string, text?: string
){
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

function mountRoot(): HTMLElement {
  let root = document.getElementById('app');
  if (!root) {
    root = h('div'); root.id = 'app';
    document.body.appendChild(root);
  }
  root.innerHTML = '';
  const container = h('div','container');
  root.appendChild(container);
  return container;
}

// ———————————————————————————————
// UI: header + filtres minimal
function renderHeader(container: HTMLElement){
  const title = h('div','h1','OWGG — Tiers, Synergies, Heatmap');
  container.appendChild(title);

  const filters = h('div','row');
  const rankSel = select(
    ['Bronze','Silver','Gold','Platinum','Diamond','Master','GM'],
    state.rank,
    v => { state.rank = v as any; renderApp(); }
  );
  const mapSel = select(['Toutes cartes', ...MAPS.map(m=>m.name)], 'Toutes cartes',
    v => {
      if (v==='Toutes cartes') state.mapId='all';
      else state.mapId = slugify(MAPS.find(m=>m.name===v)!.id);
      renderApp();
    }
  );
  const roleSel = select(['All','Tank','DPS','Support'],'All', v=>{
    state.role = v as any; renderApp();
  });

  filters.append(
    chip('Platinum', rankSel), chip('Toutes cartes', mapSel), chip('All', roleSel)
  );
  container.appendChild(filters);
}

function chip(label: string, el: HTMLElement){
  const wrap = h('div','badge'); wrap.style.display='inline-flex';
  wrap.style.alignItems='center'; wrap.style.gap='10px';
  wrap.appendChild(el);
  return wrap;
}
function select(options: string[], value: string, onChange:(v:string)=>void){
  const sel = document.createElement('select');
  sel.style.background='transparent'; sel.style.color='var(--text)';
  sel.style.border='none'; sel.style.outline='none'; sel.style.font='inherit';
  for(const o of options){
    const op = document.createElement('option'); op.value=o; op.text=o;
    if (o===value) op.selected = true;
    sel.appendChild(op);
  }
  sel.onchange = ()=> onChange(sel.value);
  return sel;
}

function slugify(s: string){ return s.toLowerCase().replace(/\s+/g,'-'); }

// ———————————————————————————————
// TIER LIST
function renderTierList(container: HTMLElement){
  const section = h('div','card section');
  const title = h('div','','Tier list'); title.style.fontSize='22px'; title.style.fontWeight='800'; title.style.marginBottom='8px';
  section.appendChild(title);

  const table = h('table','table');
  table.innerHTML = `
    <thead><tr>
      <th>Héros</th>
      <th>Winrate</th>
      <th>Pick</th>
      <th>Sample</th>
      <th>Synergies / Contres</th>
    </tr></thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody')!;

  const rows = TIER_ROWS.filter(r =>
    r.rank===state.rank &&
    (!r.mapId || state.mapId==='all') &&
    (state.role==='All' || HEROES.find(h=>h.id===r.heroId)!.role===state.role)
  ).filter(r=>!r.mapId); // global uniquement pour la table

  // tri par winrate
  rows.sort((a,b)=>b.winRate-a.winRate);

  for(const r of rows.slice(0,12)){
    const hero = HEROES.find(h=>h.id===r.heroId)!;
    const tr = document.createElement('tr');

    // Col 1: Tier + hero chip
    const tdHero = document.createElement('td');
    const letter = computeTierLetter(r.winRate, r.sample);
    const pill = h('span','tier-pill '+(
      letter==='S'?'tier-s' : letter==='A'?'tier-a' : letter==='B'?'tier-b' : letter==='C'?'tier-c':'tier-d'
    ), letter);
    pill.style.marginRight='10px';

    const chipWrap = h('span','hero-chip');
    const img = document.createElement('img');
    img.src = HERO_ICON(hero.id);
    img.alt = hero.name;
    img.onerror = ()=>{ img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"/>'; };
    chipWrap.append(img, document.createTextNode(hero.name), space(), roleTag(hero));
    tdHero.append(pill, chipWrap);

    // Col 2-4: KPIs
    const tdWR = document.createElement('td');
    tdWR.innerHTML = `<div class="kpi"><span class="big">${fmtPct(r.winRate)}</span>
      <span class="${(r.delta7d?.winRate||0)>=0?'delta-up':'delta-down'}">${fmtDelta(r.delta7d?.winRate||0)}</span></div>`;

    const tdPR = document.createElement('td');
    tdPR.innerHTML = `<div class="kpi"><span class="big">${fmtPct(r.pickRate)}</span>
      <span class="${(r.delta7d?.pickRate||0)>=0?'delta-up':'delta-down'}">${fmtDelta(r.delta7d?.pickRate||0)}</span></div>`;

    const tdN = document.createElement('td'); tdN.textContent = 'n='+r.sample;

    // Col 5: synergies (mock à partir des WR)
    const tdSyn = document.createElement('td'); tdSyn.className='synergy-col';
    const others = TIER_ROWS.filter(x=>x.rank===r.rank && x.heroId!==r.heroId && !x.mapId);
    others.sort((a,b)=>(b.winRate-a.winRate)).slice(0,3).forEach(x=>{
      const diff = +(x.winRate - r.winRate).toFixed(3);
      const pill = h('span','synergy-pill '+(diff>=0?'synergy-pos':'synergy-neg'), `${HEROES.find(h=>h.id===x.heroId)!.name} ${diff>=0?'+':''}${(diff*100).toFixed(1)}%`);
      tdSyn.appendChild(pill);
    });

    tr.append(tdHero, tdWR, tdPR, tdN, tdSyn);
    tbody.appendChild(tr);
  }

  section.appendChild(table);
  container.appendChild(section);
}

function roleTag(hero: Hero){
  const tag = h('span','badge',hero.role);
  tag.style.color = 'var(--sub)';
  return tag;
}
function space(){ return document.createTextNode(' '); }

// ———————————————————————————————
// FEED (vertical)
function renderFeed(container: HTMLElement){
  const section = h('div','card section');
  const title = h('div','','Historique'); title.style.fontSize='22px'; title.style.fontWeight='800'; title.style.marginBottom='10px';
  section.appendChild(title);

  const feed = h('div','feed');

  // filtre de matches selon filtres globaux
  const list = MATCHES.filter(m =>
    (state.mapId==='all' || m.mapId===state.mapId) &&
    (state.role==='All' || HEROES.find(h=>h.id===m.heroId)!.role===state.role) &&
    (m.rank===state.rank)
  );

  for(const m of list){
    feed.appendChild(matchCard(m));
  }

  section.appendChild(feed);
  container.appendChild(section);
}

function matchCard(m: MatchItem){
  const hero = HEROES.find(h=>h.id===m.heroId)!;
  const map: MapInfo = MAPS.find(x=>x.id===m.mapId)!;

  const art = h('article','match '+(m.result==='Win'?'win':'loss'));

  const bg = h('div','bg');  // image de fond
  art.appendChild(bg);
  const shade = h('div','shade'); art.appendChild(shade);

  const row = h('div','content');

  // gauche
  const left = h('div','left');
  const heroBox = h('div','hero');
  const img = document.createElement('img');
  img.src = HERO_ICON(hero.id);
  img.alt = hero.name;
  img.onerror = ()=>{ img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="54" height="54"/>'; };
  heroBox.appendChild(img);

  const meta = h('div','meta');
  const title = h('div','title', hero.name);
  const sub = h('div','sub', map.name);
  const kda = h('div','kda', `K/D/A: ${m.kda[0]}/${m.kda[1]}/${m.kda[2]}`);
  const when = new Date(m.date).toLocaleString();
  const date = h('div','sub', when);
  meta.append(title, sub, kda, date);

  left.append(heroBox, meta);

  // droite
  const right = h('div','right');
  const pill = h('div','result', m.result==='Win'?'Victoire':'Défaite');
  right.appendChild(pill);

  row.append(left, right);
  art.appendChild(row);

  // image de fond (local -> fallback)
  setBgWithFallback(bg, m.mapId, MAP_THUMB(m.mapId));

  return art;
}

// ———————————————————————————————
// App
export default function App(){
  // Génère les données (une seule fois)
  if (TIER_ROWS.length===0) TIER_ROWS = generateTierData();
  if (MATCHES.length===0)    MATCHES   = generateMatches(TIER_ROWS);

  const root = mountRoot();
  renderHeader(root);
  renderTierList(root);
  renderFeed(root);

  // pied de page
  const foot = h('div','footer','OWGG — demo. Images locales dans /public/maps et /public/heroes');
  root.appendChild(foot);
}

function renderApp(){ App(); }
