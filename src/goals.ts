// src/goals.ts
import type { MatchItem } from './stats';

export function mountGoals(el: HTMLElement, matches: MatchItem[]) {
  const total = matches.length;
  const wins = matches.filter(m=>m.result==='Win').length;
  const wr = total ? wins/total : 0;
  const avgDeaths = total ? (matches.reduce((a,m)=>a+m.kda[1],0)/total) : 0;

  const goals = [
    { label:'Atteindre 55% de winrate', target:0.55, progress:wr, fmt:(v:number)=> (v*100).toFixed(1)+'%' },
    { label:'Descendre sous 8 morts / game', target:8, progress:Math.max(0, 1 - Math.min(1, (avgDeaths/8))), fmt:()=> avgDeaths.toFixed(1) },
    { label:'Jouer 25 parties ce mois', target:25, progress:Math.min(1, total/25), fmt:()=> total+'' },
  ];

  el.innerHTML = `
    <div class="card">
      <strong>Objectifs du mois</strong>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:10px">
        ${goals.map(g=>{
          const pct = Math.round(g.progress*100);
          return `
            <div class="card" style="padding:12px">
              <div style="font-weight:600">${g.label}</div>
              <div style="margin:8px 0;height:10px;background:#111;border:1px solid #2a2f38;border-radius:999px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:#34d399"></div>
              </div>
              <div style="color:#9aa0a6">Progression: <strong>${pct}%</strong> &nbsp;•&nbsp; Actuel: <strong>${g.fmt(g.progress)}</strong></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
