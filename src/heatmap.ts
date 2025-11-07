// src/heatmap.ts
import type { MatchItem } from './stats';

type Point = { x: number; y: number; kind: 'death'|'heal'|'impact' };

export function mountHeatmap(el: HTMLElement, matches: MatchItem[]) {
  el.innerHTML = `
    <div class="card">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <strong>Heatmap 2D</strong>
        <span class="pill">Tap / clic pour ajouter un point (démo)</span>
      </div>
      <canvas id="hm" width="900" height="520" style="width:100%;border-radius:12px;background:#0b1220;border:1px solid #2a2f38"></canvas>
      <div class="row" style="margin-top:8px">
        <button id="hm-death">Ajouter: Mort</button>
        <button id="hm-heal">Ajouter: Soin</button>
        <button id="hm-imp">Ajouter: Impact</button>
        <button id="hm-clear">Clear</button>
        <span class="pill">Pathing démo affiché</span>
      </div>
    </div>
  `;

  const cvs = el.querySelector('#hm') as HTMLCanvasElement;
  const ctx = cvs.getContext('2d')!;
  const W = cvs.width, H = cvs.height;

  // Génère quelques points démo à partir des matchs
  const pts: Point[] = [];
  function rnd(a:number,b:number){ return a + Math.random()*(b-a); }
  matches.slice(0,16).forEach((m,i)=>{
    pts.push({ x:rnd(80,W-80), y:rnd(80,H-80), kind: m.result==='Win' ? 'impact':'death' });
    if(i%3===0) pts.push({ x:rnd(80,W-80), y:rnd(80,H-80), kind:'heal' });
  });

  let addKind: Point['kind'] = 'death';

  function draw() {
    ctx.clearRect(0,0,W,H);
    // grille
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    for(let x=60;x<W;x+=60){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=60;y<H;y+=60){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // pathing demo (polyline + “pack”)
    ctx.strokeStyle = 'rgba(74,163,255,.75)';
    ctx.lineWidth = 3;
    const path = [{x:100,y:420},{x:240,y:360},{x:420,y:300},{x:630,y:280},{x:800,y:200}];
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for(let i=1;i<path.length;i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    // packs
    ctx.fillStyle = 'rgba(16,185,129,.25)';
    [[220,340],[600,260]].forEach(([x,y])=>{
      ctx.beginPath(); ctx.arc(x,y,12,0,Math.PI*2); ctx.fill();
    });

    // points
    for(const p of pts){
      if(p.kind==='death') ctx.fillStyle = 'rgba(255,90,104,.7)';
      else if(p.kind==='heal') ctx.fillStyle = 'rgba(52,211,153,.7)';
      else ctx.fillStyle = 'rgba(74,163,255,.75)';
      ctx.beginPath();
      ctx.arc(p.x,p.y,6,0,Math.PI*2);
      ctx.fill();
    }
  }

  function addPoint(e: MouseEvent) {
    const r = cvs.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (H / r.height);
    pts.push({ x, y, kind: addKind });
    draw();
  }

  cvs.addEventListener('click', addPoint);
  el.querySelector('#hm-death')!.addEventListener('click', ()=>addKind='death');
  el.querySelector('#hm-heal')!.addEventListener('click', ()=>addKind='heal');
  el.querySelector('#hm-imp')!.addEventListener('click', ()=>addKind='impact');
  el.querySelector('#hm-clear')!.addEventListener('click', ()=>{ pts.splice(0,pts.length); draw(); });

  draw();
}
