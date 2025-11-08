// src/imgFallback.ts
export function setBgWithFallback(
  el: HTMLElement,
  slug: string,                  // ex: "route-66"
  remoteFallback: string         // ex: une URL picsum ou autre
) {
  const exts = ['jpg','webp','png'];
  let i = 0;

  const tryNext = () => {
    if (i < exts.length) {
      const url = `/maps/${slug}.${exts[i++]}`;
      probe(url, ok => {
        if (ok) el.style.backgroundImage = `url("${url}")`;
        else tryNext();
      });
    } else {
      el.style.backgroundImage = `url("${remoteFallback}")`;
    }
  };
  tryNext();
}

function probe(url: string, cb: (ok:boolean)=>void) {
  const img = new Image();
  img.onload = () => cb(true);
  img.onerror = () => cb(false);
  img.src = url + `?v=${Date.now()}`; // évite un vieux 404 en cache
}
