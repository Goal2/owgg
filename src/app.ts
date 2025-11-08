// src/app.ts — OPPG-like, feed vertical + vraies images de cartes + portrait héros + synergies
import {
  generateTierData, computeTierLetter, listSynergies,
  generateMatches, fmtPct, fmtDelta,
  HEROES, MAPS, HERO_NAME, MAP_NAME, MAP_THUMB,
  MAP_IMAGE, HERO_ICON,            // <— nouveaux helpers (Step 2)
  type Rank, type TierRow, type MatchItem
} from './stats';

const $ = (s:string, r:Document|HTMLElement=document)=>r.querySelector(s) as HTMLElement;

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
    --card:#111418; --line:#222832;
    --blue:#59a9ff; --red:#ff6a76; --green:#34d399; --gold:#f59e0b;
  }
  html,body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,Arial,sans-serif;margin:0}
  .container{max-width:1200px;margin:0 auto;padding:24px}
  h1{font-size:34px;margin:0 0 12px;letter-spacing:.3px}
  .sub{color:var(--muted);margin-bottom:10px}
  .filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
  select{appearance:none;background:#161a22;color:var(--fg);
    border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-weight:600}
  .layout{display:grid;grid-template-columns:3fr 1.2fr;gap:18px}
  .card{background:linear-gradient(180deg,#0f1217 0%, #0b0e13 100%);
    border:1px solid var(--line);border-radius:16px;padding:14px}
  .section-title{font-weight:800;margin-bottom:10px;letter-spacing:.2px}
  /* Tiers */
  .tiers{display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1.5fr;gap:6px;align-items:center}
  .tiers .head{color:var(--muted);font-size:12px}
  .heroRow{display:contents}
  .badge{font-weight:900;border-radius:10px;padding:2px 8px;color:#111;display:inline-block}
  .S{background:linear-gradient(45deg,#fde047,#f59e0b);color:#111}
  .A{background:#10b981;color:#062a23}
  .B{background:#60a5fa;color:#0b1220}
  .C{background:#a78bfa;color:#0e0a1a}
  .D{background:#9ca3af;color:#111}
  .delta.pos{color:var(--green)} .delta.neg{color:var(--red)}
  .pill{font-size:12px;padding:2px 8px;border-radius:999px;background:#0c0f14;border:1px solid var(--line)}
  .synergy{display:flex;gap:8px;flex-wrap:wrap}
  .synergy .item{background:#0f131b;border:1px solid var(--line);padding:4px 8px;border-radius:999px}
  /* Matches vertical */
  .matches{display:flex;flex-direction:column;gap:14px}
  .match{
    position:relative; overflow:hidden;
    border-radius:18px; border:2px solid var(--line); background:var(--card)
  }
  .match.win{border-color:rgba(89,169,255,.7); box-shadow:0 0 0 2px rgba(89,169,255,.12) inset}
  .match.loss{border-color:rgba(255,106,118,.75); box-shadow:0 0 0 2px rgba(255,106,118,.10) inset}
  .match .bg{position:absolute;inset:0;opacity:.22;background-size:cover;background-position:center;filter:saturate(.95) contrast(1.06)}
  .match .overlay{position:absolute;inset:0;background:radial-gradient(120% 140% at 10% 0%, rgba(0,0,0,.55), rgba(0,0,0,.15) 60%, rgba(0,0,0,.55))}
  .match .content{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;padding:14px}
  .match .hero{
    width:56px;height:56px;border-radius:12px;border:2px solid rgba(255,255,255,.12);
    background:#0c0f14 url('') center/cover no-repeat
  }
  .match .meta{display:flex;flex-direction:column}
  .match .title{font-weight:800;letter-spacing:.3px}
  .match .sub{font-size:12px;color:var(--muted)}
  .match .right{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
  .match .status{font-weight:800;border-radius:999px;padding:4px 10px;background:#0c1016;border:1px solid var(--line)}
  .match.win .status{color:#bfe0ff;border-color:rgba(89,169,255,.4)}
  .match.loss .status{color:#ffc2c7;border-color:rgba(255,106,118,.4)}
  .tags{display:flex;gap:6px;flex-wrap:wrap}
  .tag{font-size:12px;border:1px solid var(--line);background:#0e1117;border-radius:999px;padding:3px 8px}
  /* KPIs */
  .kpi{display:flex;gap:6px;align-items:center}
  @media(max-width:1000px){ .layout{grid-template-columns:1fr} }
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
}

function layout(){
  document.body.innerHTML = `
  <div class="container">
    <h1>OWGG — <span class="sub">Tiers, synergies, historique</span></h1>

    <div class="filters">
      <select id="rank">
        ${(['Bronze','Silver','Gold','Platinum','Diamond','Master','GM'] as Rank[]).map(r=>`<option ${r==='Platinum'?'selected':''}>${r}</option>`).join('')}
      </select>
      <select id="map">
        <option value="">Toutes cartes</option>
        ${MAPS.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}
      </select>
      <select id="role">
        ${['All','Tank','DPS','Support'].map(r=>`<option ${r==='All'?'selected':''}>${r}</option>`).join('')}
      </select>
    </div>

    <div class="layout">
      <div id="col-main"></div>
      <div id="col-side"></div>
    </div>
  </div>`;
  $('#rank')!.addEventListener('change',e=>{ STATE.rank=(e.target as HTMLSelectElement).value as Rank; render(); });
  $('#map')!.addEventListener('change',e=>{ const v=(e.target as HTMLSelectElement).value; STATE.mapId = v||undefined; render(); });
  $('#role')!.addEventListener('change',e=>{ STATE.role=(e.target as HTMLSelectElement).value as any; render(); });
}

/** Trouve le meilleur et le pire allié pour un héros donné, au rang / carte filtrés */
function topSynergiesFor(heroId:string){
  const plus = listSynergies(TIER_ROWS, heroId, STATE.rank, STATE.mapId)
    .filter(s=>s.score>0).sort((a,b)=>b.score-a.score)[0];
  const minus = listSynergies(TIER_ROWS, heroId, STATE.rank, STATE.mapId)
    .filter(s=>s.score<0).sort((a,b)=>a.score-b.score)[0];
  return { plus, minus };
}

function viewTiers():string{
  const rows = TIER_ROWS.filter(r=>r.rank===STATE.rank && (!STATE.mapId || r.mapId===STATE.mapId));
  const bestByHero = new Map<string,TierRow>();
  for(const r of rows){ const k=r.heroId; if(!bestByHero.has(k) || (bestByHero.get(k)!.winRate<r.winRate)) bestByHero.set(k,r); }
  const heroList = HEROES.filter(h=>STATE.role==='All' || h.role===STATE.role)
    .sort((a,b)=>(bestByHero.get(b.id)?.winRate ?? 0)-(bestByHero.get(a.id)?.winRate ?? 0));

  const rowsHtml = heroList.map(h=>{
    const r = bestByHero.get(h.id); if(!r) return '';
    const tier = computeTierLetter(r.winRate, r.sample);
    const dW = r.delta7d?.winRate ?? 0, dP = r.delta7d?.pickRate ?? 0;
    const syns = topSynergiesFor(h.id);
    const synHtml = [syns.plus, syns.minus].filter(Boolean).map(s=>(
      `<span class="item" style="color:${(s!.score>=0)?'#34d399':'#ff7a85'}">${HERO_NAME(s!.withHeroId)} ${(s!.score>=0?'+':'')}${(s!.score*100).toFixed(1)}%</span>`
    )).join('');
    return `
    <div class="heroRow">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="badge ${tier}">${tier}</span>
        <strong>${h.name}</strong> <span class="pill">${h.role}</span>
      </div>
      <div>${fmtPct(r.winRate)} <span class="delta ${dW>0?'pos':dW<0?'neg':''}">${fmtDelta(dW)}</span></div>
      <div>${fmtPct(r.pickRate)} <span class="delta ${dP>0?'pos':dP<0?'neg':''}">${fmtDelta(dP)}</span></div>
      <div>n=${r.sample}</div>
      <div class="synergy">${synHtml}</div>
    </div>`;
  }).join('');

  return `
    <div class="card">
      <div class="section-title">Tier list</div>
      <div class="tiers">
        <div class="head">Héros</div><div class="head">Winrate</div><div class="head">Pick</div><div class="head">Sample</div><div class="head">Synergies</div>
        ${rowsHtml}
      </div>
    </div>`;
}

function viewMatches():string{
  const items = MATCHES.map(m=>{
    const win = m.result==='Win';
    // image locale de la carte, avec fallback si non présente
    const local = MAP_IMAGE(m.mapId);
    const fallback = MAP_THUMB(m.mapId);
    const heroIcon = HERO_ICON(m.heroId);

    const { plus, minus } = topSynergiesFor(m.heroId);
    const tags = [
      plus ? `<span class="tag" style="color:#34d399">+ ${HERO_NAME(plus.withHeroId)} ${(plus.score*100).toFixed(1)}%</span>` : '',
      minus? `<span class="tag" style="color:#ff7a85">- ${HERO_NAME(minus.withHeroId)} ${(minus.score*100).toFixed(1)}%</span>` : '',
      `<span class="tag">${MAP_NAME(m.mapId)}</span>`
    ].join('');

    const kda = `${m.kda[0]}/${m.kda[1]}/${m.kda[2]}`;
    const date = new Date(m.date).toLocaleString();

    return `
    <div class="match ${win?'win':'loss'}">
      <div class="bg" style="background-image:url('${local}')" onerror="this.style.backgroundImage='url(${JSON.stringify(fallback)})'"></div>
      <div class="overlay"></div>
      <div class="content">
        <div class="hero" style="background-image:url('${heroIcon}')"></div>
        <div class="meta">
          <div class="title">${HERO_NAME(m.heroId)}</div>
          <div class="sub">${date} • K/D/A ${kda}</div>
          <div class="tags">${tags}</div>
        </div>
        <div class="right">
          <div class="status">${win?'Victoire':'Défaite'}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
    <div class="card">
      <div class="section-title">Historique</div>
      <div class="matches">${items}</div>
    </div>`;
}

function viewSide():string{
  const total = MATCHES.length;
  const wins  = MATCHES.filter(m=>m.result==='Win').length;
  const wr = total? (wins/total):0;

  return `
    <div class="card">
      <div class="section-title">Mes KPIs</div>
      <div class="kpi">Parties: <strong>${total}</strong></div>
      <div class="kpi">Victoires: <strong>${wins}</strong></div>
      <div class="kpi">Winrate: <strong>${(wr*100).toFixed(1)}%</strong></div>
      <hr style="border-color:var(--line);opacity:.4;margin:10px 0">
      <div class="kpi">Objectif Winrate 55%
        <div style="flex:1;height:8px;background:#0a0d12;border:1px solid var(--line);border-radius:999px;overflow:hidden;margin-left:8px">
          <div style="width:${Math.min(100, (wr/0.55)*100)}%;height:100%;background:linear-gradient(90deg,#34d399,#a7f3d0)"></div>
        </div>
      </div>
    </div>`;
}

function render(){
  $('#col-main')!.innerHTML = viewTiers() + viewMatches();
  $('#col-side')!.innerHTML = viewSide();
}

export default async function App(){
  mountStyles();
  layout();
  // Données locales (pas d’appels réseau)
  TIER_ROWS = generateTierData();
  MATCHES   = generateMatches(TIER_ROWS);
  render();
}
