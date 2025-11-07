// src/timeline.ts
import type { MatchItem } from './stats';

export function mountTimeline(el: HTMLElement, matches: MatchItem[]) {
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <strong>Timeline & Ult tracker</strong>
        <span class="pill">Estimation ults/min</span>
      </div>
      <div id="tl-wrap" style="overflow:auto">
        <div id="tl" style="height:120px; min-width:900px; position:relative; background:#0b1220; border:1px solid #2a2f38; border-radius:12px;"></div>
      </div>
      <div id="kpis" style="margin-top:10px;color:#9aa0a6"></div>
    </div>
  `;

  // Matchs récents → on projette des événements uniformément
  const recent = matches.slice(0,8).reverse(); // du plus ancien au plus récent
  const totalDur = recent.length * 6 * 60 * 1000; // ~6min par game
  const tl = el.querySelector('#tl') as HTMLDivElement;

  let cur = 0;
  const events: {t:number; type:'kill'|'death'|'ult'}[] = [];
  function rnd(a:number,b:number){ return a + Math.random()*(b-a); }

  for(const m of recent){
    const kills = Math.max(2, m.kda[0]);
    const deaths = Math.max(1, m.kda[1]);
    const ults = Math.max(1, Math.round((kills+deaths)/4));
    for(let i=0;i<kills;i++) events.push({ t: cur + rnd(15,300)*1000, type:'kill' });
    for(let i=0;i<deaths;i++) events.push({ t: cur + rnd(30,300)*1000, type:'death' });
    for(let i=0;i<ults;i++) events.push({ t: cur + rnd(40,320)*1000, type:'ult' });
    cur += 6*60*1000;
  }

  // Render
  tl.innerHTML = '';
  const W = Math.max(900, recent.length*220);
  tl.style.minWidth = W+'px';

  // ticks
  for(let x=0;x<=W;x+=110){
    const div = document.createElement('div');
    div.style.position='absolute';
    div.style.left=x+'px';
    div.style.top='0';
    div.style.bottom='0';
    div.style.width='1px';
    div.style.background='rgba(255,255,255,.06)';
    tl.appendChild(div);
  }

  function place(t:number){ return Math.floor((t/totalDur)*W); }
  for(const ev of events){
    const dot = document.createElement('div');
    dot.style.position='absolute';
    dot.style.left = place(ev.t)+'px';
    dot.style.top = ev.type==='ult' ? '20px' : ev.type==='kill' ? '55px' : '85px';
    dot.style.width = dot.style.height = ev.type==='ult' ? '10px' : '8px';
    dot.style.borderRadius='50%';
    dot.title = ev.type;
    if(ev.type==='ult') dot.style.background='rgba(251,191,36,.95)';
    else if(ev.type==='kill') dot.style.background='rgba(74,163,255,.95)';
    else dot.style.background='rgba(255,90,104,.95)';
    tl.appendChild(dot);
  }

  // KPIs
  const ults = events.filter(e=>e.type==='ult').length;
  const mins = totalDur/60000;
  const upm = (ults/mins).toFixed(2);
  el.querySelector('#kpis')!.innerHTML = `
    Ults: <strong>${ults}</strong> &nbsp;•&nbsp; Durée: <strong>${mins.toFixed(1)} min</strong> &nbsp;•&nbsp; Ults/min: <strong>${upm}</strong>
  `;
}
