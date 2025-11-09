// src/app.ts
import { HEROES, TIER, MATCHES, MAP_IMAGES, type Hero, type TierRow, type Match } from './data';

export default function App() {
  const root = document.getElementById('app')!;
  root.innerHTML = `
    <div class="navbar">
      <div class="navbar-inner container">
        <div class="brand">ULTO<b>.gg</b></div>
        <div class="tabs" role="tablist" aria-label="Navigation">
          <button class="tab active" data-tab="home">Accueil</button>
          <button class="tab" data-tab="account">Compte</button>
        </div>
      </div>
    </div>
    <div class="container" id="screen-home"></div>
    <div class="container hide" id="screen-account"></div>
  `;

  // Tab switching
  root.querySelectorAll<HTMLButtonElement>('.tab').forEach(btn=>{
    btn.onclick = () => {
      root.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab!;
      (document.getElementById('screen-home')!).classList.toggle('hide', tab!=='home');
      (document.getElementById('screen-account')!).classList.toggle('hide', tab!=='account');
    };
  });

  renderHome();
  renderAccount();
}

/* ---------- Accueil ---------- */
function renderHome() {
  const sc = document.getElementById('screen-home')!;
  sc.innerHTML = `
    <h2 class="section-title">OWGG — Tiers, Synergies, Heatmap</h2>

    <div class="filters">
      <select class="select"><option>Platinum</option></select>
      <select class="select"><option>Toutes cartes</option></select>
      <select class="select"><option>All</option></select>
    </div>

    <section class="card" style="padding:16px;margin-bottom:16px">
      <h3 class="section-title">Tier list</h3>
      <div style="overflow:auto">
        <table class="table" id="tier-table">
          <thead>
            <tr>
              <th>Héros</th><th>Winrate</th><th>Pick</th><th>Sample</th><th>Synergies / Contres</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </section>

    <section class="card" style="padding:16px">
      <h3 class="section-title">Historique</h3>
      <div class="feed" id="match-feed"></div>
    </section>
  `;

  // Tier rows
  const tbody = sc.querySelector('tbody')!;
  TIER.forEach((row) => {
    const h = getHero(row.heroId)!;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span class="tier ${row.tier}">${row.tier}</span>
        <span style="margin-left:8px;display:inline-flex;align-items:center;gap:10px">
          <img src="${h.portrait}" alt="${h.name}" width="28" height="28" style="border-radius:6px;border:1px solid #263147"/>
          <strong>${h.name}</strong>
          <span class="badge">${h.role}</span>
        </span>
      </td>
      <td>
        <div><strong>${row.winrate.toFixed(1)}%</strong></div>
        <div style="color:${row.deltaWin>=0?'#3ddc97':'#ff6b6b'}">${arrow(row.deltaWin)} ${Math.abs(row.deltaWin).toFixed(1)}%</div>
      </td>
      <td>
        <div><strong>${row.pick.toFixed(1)}%</strong></div>
        <div style="color:${row.deltaPick>=0?'#3ddc97':'#ff6b6b'}">${arrow(row.deltaPick)} ${Math.abs(row.deltaPick).toFixed(1)}%</div>
      </td>
      <td>n=${row.sample}</td>
      <td>
        <div class="synergy">
          ${row.bestWith.map(x=>`<span class="chip">${x}</span>`).join('')}
          ${row.counters.map(x=>`<span class="chip" style="border-color:#3a2730;color:#ffb2bc">${x}</span>`).join('')}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Match feed
  const feed = sc.querySelector('#match-feed')!;
  MATCHES.forEach(m=>{
    const h = getHero(m.heroId)!;
    const el = document.createElement('article');
    el.className = `match ${m.win?'win':'lose'}`;
    el.style.setProperty('--map', `url(${getMapURL(m.mapSlug)})`);
    // background via ::before
    (el as any).style.setProperty = new Proxy((el as any).style.setProperty, {
      apply(target, thisArg, args) {
        if(args[0]==='--map') {
          (el as HTMLElement).style.setProperty('--map', `url(${getMapURL(m.mapSlug)})`);
          (el as HTMLElement).style.setProperty('--bg', `url(${getMapURL(m.mapSlug)})`);
        }
        return Reflect.apply(target, thisArg, args);
      }
    });

    el.innerHTML = `
      <div class="hero-portrait"><img src="${h.portrait}" alt="${h.name}" loading="lazy"/></div>
      <div class="row">
        <div class="left">
          <div class="title">${h.name}</div>
          <div>${m.mapName}</div>
          <div class="kda">K/D/A : ${m.k}/${m.d}/${m.a}</div>
          <div class="kda">${fmtDate(m.dateISO)}</div>
          <div class="synergy">
            ${m.teamSynergy.map(x=>`<span class="chip">${x}</span>`).join('')}
          </div>
        </div>
        <div class="pill ${m.win?'win':'lose'}">${m.win?'Victoire':'Défaite'}</div>
      </div>
    `;
    // map background
    (el as HTMLElement).style.setProperty('--bg', `url(${getMapURL(m.mapSlug)})`);
    (el as HTMLElement).style.cssText += `
      --bg: url(${getMapURL(m.mapSlug)});
    `;
    el.querySelector<HTMLElement>(':scope')!.style.setProperty('--map', `url(${getMapURL(m.mapSlug)})`);
    (el as HTMLElement).style.setProperty('--map', `url(${getMapURL(m.mapSlug)})`);
    // fallback si l’image manque
    const imgTest = new Image();
    imgTest.src = getMapURL(m.mapSlug);
    imgTest.onerror = () => { el.style.setProperty('background-image',''); };
    imgTest.onload = () => {
      el.style.setProperty('background-image','');
      (el as any).style = el.style; // noop
    };
    // Pseudo :before via inline style
    el.style.setProperty('background', 'var(--panel)');
    el.style.setProperty('position','relative');
    // inject a <style> tag for ::before background
    const style = document.createElement('style');
    style.textContent = `
      article.match:nth-of-type(n)::before { background-image: var(--bg); }
    `;
    el.appendChild(style);
    feed.appendChild(el);
  });
}

/* ---------- Compte ---------- */
function renderAccount() {
  const sc = document.getElementById('screen-account')!;
  // (mock) stats cumulées
  const total = MATCHES.length;
  const wins = MATCHES.filter(m=>m.win).length;
  const wr = total? Math.round(wins/total*100) : 0;

  // héro le plus joué
  const counts = new Map<string, number>();
  MATCHES.forEach(m=>counts.set(m.heroId,(counts.get(m.heroId)||0)+1));
  const topHeroId = [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];
  const topHero = topHeroId ? getHero(topHeroId)! : HEROES[0];

  sc.innerHTML = `
    <section class="card" style="padding:16px;margin-bottom:16px">
      <h3 class="section-title">Mon compte</h3>
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${topHero.portrait}" alt="" width="56" height="56" style="border-radius:12px;border:1px solid #253047"/>
        <div>
          <div style="font-weight:800">DAARKPONEY#1000</div>
          <div style="color:#9fb0c6">Taux de victoire <b style="color:#fff">${wr}%</b> — Top héros : <b>${topHero.name}</b></div>
        </div>
      </div>
    </section>

    <section class="card" style="padding:16px">
      <h3 class="section-title">Historique (compte)</h3>
      <div class="feed" id="account-feed"></div>
    </section>
  `;

  const feed = sc.querySelector('#account-feed')!;
  MATCHES.forEach(m=>{
    const h = getHero(m.heroId)!;
    const el = document.createElement('article');
    el.className = `match ${m.win?'win':'lose'}`;
    el.innerHTML = `
      <div class="hero-portrait"><img src="${h.portrait}" alt="${h.name}" loading="lazy"/></div>
      <div class="row">
        <div class="left">
          <div class="title">${h.name}</div>
          <div>${m.mapName}</div>
          <div class="kda">K/D/A : ${m.k}/${m.d}/${m.a}</div>
          <div class="kda">${fmtDate(m.dateISO)}</div>
          <div class="synergy">
            ${m.teamSynergy.map(x=>`<span class="chip">${x}</span>`).join('')}
          </div>
        </div>
        <div class="pill ${m.win?'win':'lose'}">${m.win?'Victoire':'Défaite'}</div>
      </div>
    `;
    // fond carte
    el.style.setProperty('--bg', `url(${getMapURL(m.mapSlug)})`);
    const style = document.createElement('style');
    style.textContent = `article.match:nth-of-type(n)::before{background-image:var(--bg)}`;
    el.appendChild(style);
    feed.appendChild(el);
  });
}

/* ---------- utils ---------- */
function getHero(id:string):Hero|undefined {
  return HEROES.find(h=>h.id===id);
}
function getMapURL(slug:string):string {
  return MAP_IMAGES[slug] ?? `/maps/${slug}.jpg`;
}
function arrow(n:number){ return n>=0?'↑':'↓'; }
function fmtDate(iso:string){
  const d=new Date(iso);
  return d.toLocaleString('fr-FR',{timeZone:'UTC'}); // simple
}
