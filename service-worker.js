const CACHE="ks-roadmark-v7";
const CORE=[
  "./","./index.html","./styles.css","./app.js","./book-data.js","./gallery-data.js",
  "./manifest.json","./icon-192.png","./icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

async function networkFirst(req){
  const cache=await caches.open(CACHE);
  try{
    const fresh=await fetch(req,{cache:"no-store"});
    if(fresh && fresh.ok) cache.put(req,fresh.clone());
    return fresh;
  }catch(e){
    const old=await cache.match(req);
    if(old) return old;
    throw e;
  }
}

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  const url=new URL(req.url);
  const dynamic=["/app.js","/book-data.js","/gallery-data.js","/manifest.json"];
  if(url.origin===location.origin && dynamic.some(x=>url.pathname.endsWith(x))){
    event.respondWith(networkFirst(req));
    return;
  }
  if(req.mode==="navigate"){
    event.respondWith(networkFirst(req).catch(()=>caches.match("./index.html")));
    return;
  }
  event.respondWith(
    caches.match(req).then(hit=>hit||fetch(req).then(resp=>{
      if(url.origin===location.origin && resp && resp.ok){
        const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(req,copy));
      }
      return resp;
    }))
  );
});
