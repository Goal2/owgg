// src/app.ts (VERSION MISE À JOUR)
import { generateTierData, computeTierLetter, listSynergies,
         generateMatches, fmtPct, fmtDelta,
         HEROES, MAPS, HERO_NAME, MAP_NAME, MAP_THUMB,
         type Rank, type TierRow, type MatchItem } from './stats';
import { loadAll } from './api';
import { mountHeatmap } from './heatmap';
import { mountTimeline } from './timeline';
import { mountGoals } from './goals';

const $ = (sel:string,root:Document|HTMLElement=document)=>root.querySelector(sel) as HTMLElement;
const $$ = (sel:string,root:Document|HTMLElement=document)=>Array.from(root.querySelectorAll(sel)) as HTMLElement[];

let TIER_ROWS: TierRow[] = [];
let MATCHES: MatchItem[] = [];

const STATE = {
  rank: 'Platinum' as Rank,
  mapId: '' as string|undefined,
  role: 'All' as 'All'|'Tank'|'DPS'|'Support'
};

function mountStyles(){
  const css = `
  :root{
    --bg:#0b0c10; --fg:#e5e7eb; --muted:#9aa0a6;
    --card:#12151a; --line:#2a2f38; --blue:#4aa3ff; --red:#ff5a68; --green:#34d399; --amber:#fbbf24;
  }
  html,body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,Arial,sans-serif;margin:0}
  .container{max-width:1120px;margin:0 auto;padding:24px}
  h1{font-size:32px;margin:0 0 16px}
  .tabs{display:flex;gap:8px;margin:16px 0;flex-wrap:wrap}
  .tab{background:#141821;border:1px solid var(--line);padding:8px 12px;border-radius:12px;cursor:pointer}
  .tab.active{outline:2px solid #3b82f6}
  .row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
  select,button{background:#161a22;color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
  .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px}
  .kpi{display:flex;gap:8px;align-items:center}
  .delta.pos{color:var(--green)} .delta.neg{color:var(--red)} .pill{font-size:12px;padding:2px 8px;border-radius:999px;background:#111;border:1px solid var(--line)}
  .tiers{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:6px;align-items:center}
  .tiers .head{color:var(--muted);font-size:12px}
  .heroRow{display:contents}
  .badge{font-weight:700;border-radius:10px;padding:2px 8px;color:#111;display:inline-block}
  .S{background:linear-gradient(45deg,#fde047,#f59e0b);color:#111}
  .A{background:#10b981;color:#062a23}
  .B{background:#60a5fa;color:#0b1220}
  .C{background:#a78bfa;color:#0e0a1a}
  .D{background:#9ca3af;color:#111}
  .synergy{display:flex;gap:8px;flex-wrap:wrap}
  .synergy .item{background:#0f131b;border:1px solid var(--line);padding:6px 10px;border-radius:999px}
  .synergy .pos{border-color:#1f8f62;color:#34d399}
  .synergy .neg{border-color:#9b2c2c;color:#ff7a85}
  .matches{display:flex;gap:12px;overflow:auto;padding-bottom:8px}
  .match{min-width:270px;background:var(--card);border:2px solid var(--line);border-radius:18px;position:relative}
  .match.win{border-color:rgba(74,163,255,.65); box-shadow:0 0 0 2px rgba(74,163,255,.15) inset}
  .match.loss{border-color:rgba(255,90,104,.65); box-shadow:0 0 0 2px rgba(255,90,104,.12) inset}
  .match .bg{position:absolute;inset:0;border-radius:16px;opacity:.18;background-size:cover;background-position:center;filter:saturate(.9) contrast(1.05)}
  .match .content{position:relative;padding:12px}
  .match .pill{position:absolute;top:10px;right:10px}
  .kda{color:var(--muted);font-size:12px}
  @media(max-width:900px){ .grid{grid-template-columns:repeat(3,1fr)} .tiers{grid-template-columns:1.5fr 1fr 1fr 1fr 1fr}}
  `;
  const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
}

function layout(){
  document.body.innerHTML = `
  <div class="container">
    <h1>OWGG — <span style="color:#9aa0a6">Tiers, Synergies, Heatmap</span></h1>
    <div class="row">
      <div class="tabs" id="tabs">
        <div class="tab active" data-tab="tiers">Tier list</div>
        <div class="tab" data-tab="matches">Matchs</div>
        <div class="tab" data-tab="heatmap">Heatmap</div>
        <div class="tab" data-tab="timeline">Timeline</div>
        <div class="tab" data-tab="account">Objectifs</div>
      </div>
      <select id="rank">
        ${(['Bronze','Silver','Gold','Platinum','Diamond','Master','GM'] as Rank[]).map(r=>`<option ${r===STATE.rank?'selected':''}>${r}</option>`).join('')}
      </select>
      <select id="map">
        <option value="">Toutes cartes</option>
        ${MAPS.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}
      </select>
      <select id="role">
        ${['All','Tank','DPS','Support'].map(r=>`<option ${r===STATE.role?'selected':''}>${r}</option>`).join('')}
      </select>
    </div>

    <div id="view"></div>
  </div>`;
  $('#rank')!.addEventListener('change',e=>{ STATE.rank = (e.target as HTMLSelectElement).value as Rank; render(); });
  $('#map')!.addEventListener('change',e=>{ const v=(e.target as HTMLSelectElement).value; STATE.mapId = v||undefined; render(); });
  $('#role')!.addEventListener('change',e=>{ STATE.role = (e.target as HTMLSelectElement).value as any; render(); });
  $$('.tab','#tabs').forEach(t=>{
    t.addEventListener('click',()=>{
      $$('.tab','#tabs').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      render((t as HTMLElement).dataset.tab as any);
    });
  });
}

function viewTiers(){
  const rows = TIER_ROWS.filter(r=>r.rank===STATE.rank && (!STATE.mapId || r.mapId===STATE.mapId));
  const byHero = new Map<string,TierRow>();
  for(const r of rows) if(!byHero.has(r.heroId)) byHero.set(r.heroId,r);
  const heroList = HEROES.filter(h=>STATE.role==='All' || h.role===STATE.role);
  heroList.sort((a,b)=>{
    const ra = byHero.get(a.id)?.winRate ?? 0;
    const rb = byHero.get(b.id)?.winRate ?? 0;
    return rb-ra;
  });

  const rowsHtml = heroList.map(h=>{
    const r = byHero.get(h.id);
    if(!r) return '';
    const tier = computeTierLetter(r.winRate, r.sample);
    const deltaW = r.delta7d?.winRate ?? 0;
    const deltaP = r.delta7d?.pickRate ?? 0;
    const dW = `<span class="delta ${deltaW>0?'pos':deltaW<0?'neg':''}">${fmtDelta(deltaW)}</span>`;
    const dP = `<span class="delta ${deltaP>0?'pos':deltaP<0?'neg':''}">${fmtDelta(deltaP)}</span>`;
    const syns = listSynergies(TIER_ROWS, h.id, STATE.rank, STATE.mapId);
    const synHtml = syns.map(s=>{
      const c = s.score>=0 ? 'pos' : 'neg';
      const nm = HERO_NAME(s.withHeroId);
      return `<span class="item ${c}">${nm} ${s.score>=0?'+':''}${(s.score*100).toFixed(1)}%</span>`;
    }).join('');
    return `
    <div class="heroRow">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="badge ${tier}">${tier}</span>
        <strong>${h.name}</strong> <span class="pill">${h.role}</span>
      </div>
      <div>${fmtPct(r.winRate)} ${dW}</div>
      <div>${fmtPct(r.pickRate)} ${dP}</div>
      <div class="kpi">n=${r.sample}</div>
      <div class="synergy">${synHtml}</div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="tiers">
      <div class="head">Héros</div>
      <div class="head">Winrate</div>
      <div class="head">Pick</div>
      <div class="head">Sample</div>
      <div class="head">Synergies / Contres</div>
      ${rowsHtml}
    </div>
  </div>`;
}

function viewMatches(){
  const items = MATCHES.map(m=>{
    const win = m.result==='Win';
    const bg = MAP_THUMB(m.mapId);
    const kda = `${m.kda[0]}/${m.kda[1]}/${m.kda[2]}`;
    return `
    <div class="match ${win?'win':'loss'}">
      <div class="bg" style="background-image:url('${bg}')"></div>
      <div class="content">
        <span class="pill">${win?'Victoire':'Défaite'}</span>
        <div style="font-weight:700;margin-top:14px">${HERO_NAME(m.heroId)}</div>
        <div style="color:var(--muted)">${MAP_NAME(m.mapId)}</div>
        <div class="kda">K/D/A: ${kda}</div>
        <div class="kda">${new Date(m.date).toLocaleString()}</div>
      </div>
    </div>`;
  }).join('');

  return `
  <div class="card">
    <div class="matches">${items}</div>
  </div>`;
}

function viewHeatmap(){
  const div = document.createElement('div');
  mountHeatmap(div, MATCHES);
  return div.outerHTML;
}

function viewTimeline(){
  const div = document.createElement('div');
  mountTimeline(div, MATCHES);
  return div.outerHTML;
}

function viewGoals(){
  const div = document.createElement('div');
  mountGoals(div, MATCHES);
  return div.outerHTML;
}

function render(tab:'tiers'|'matches'|'account'|'heatmap'|'timeline' = 'tiers'){
  const view = $('#view')!;
  if(tab==='tiers') view.innerHTML = viewTiers();
  if(tab==='matches') view.innerHTML = viewMatches();
  if(tab==='heatmap') view.innerHTML = viewHeatmap();
  if(tab==='timeline') view.innerHTML = viewTimeline();
  if(tab==='account') view.innerHTML = viewGoals();
}

export default async function App(){
  mountStyles();
  layout();
  // Charge via façade (future API)
  const data = await loadAll();
  TIER_ROWS = data.tiers;
  MATCHES = data.matches;
  render('tiers');
}
