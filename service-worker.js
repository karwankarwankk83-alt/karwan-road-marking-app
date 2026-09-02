const CACHE='ks-roadmark-v27';
const CORE=[
  './','./index.html','./styles.css','./app.js','./calculator-v2.js','./marking-designer.js','./assistant.js','./book-data.js',
  './gallery-data.js','./assets/ks-greeting.mp3','./manifest.json','./icon-192.png','./icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin)return;

  const dynamic=['/app.js','/calculator-v2.js','/marking-designer.js','/assistant.js','/styles.css','/book-data.js','/gallery-data.js','/manifest.json'];
  const isDynamic=dynamic.some(x=>url.pathname.endsWith(x));

  if(event.request.mode==='navigate' || isDynamic){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
          return resp;
        })
        .catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return resp;
      });
    })
  );
});