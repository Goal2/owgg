// Cache très simple (html, js, css, images)
self.addEventListener('install',e=>{
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(caches.open('owgg-v1').then(async cache=>{
    const hit = await cache.match(req);
    if(hit) return hit;
    try{
      const res = await fetch(req);
      if(req.method==='GET' && res.ok) cache.put(req, res.clone());
      return res;
    }catch{
      return hit || Response.error();
    }
  }));
});
