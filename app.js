
const B=window.BOOK_DATA;
const FALLBACK_GALLERY=[{"id":7,"en":"Yield Triangle","ku":"مثلثی پێش دەست","category":"Give Way","src":"assets/photos/photo_07.jpg"},{"id":8,"en":"Straight + Turn Arrow","ku":"تیری ڕاست + پێچ","category":"Arrows","src":"assets/photos/photo_08.jpg"},{"id":9,"en":"Yellow Box","ku":"ناوچەی زەرد","category":"Special","src":"assets/photos/photo_09.jpg"},{"id":10,"en":"Three-Direction Arrow","ku":"تیری سێ ئاراستە","category":"Arrows","src":"assets/photos/photo_10.jpg"},{"id":12,"en":"Exit Arrow","ku":"تیری دەرچوون","category":"Arrows","src":"assets/photos/photo_12.jpg"},{"id":13,"en":"Lane Drop Arrow","ku":"تیری کەمبوونەوەی ڕێڕەو","category":"Arrows","src":"assets/photos/photo_13.jpg"},{"id":15,"en":"Chevron","ku":"Chevron","category":"Special","src":"assets/photos/photo_15.jpg"},{"id":16,"en":"Hatched Area","ku":"ناوچەی هاشوورکراو","category":"Special","src":"assets/photos/photo_16.jpg"},{"id":17,"en":"Painted Island","ku":"دوورگەی بۆیاخکراو","category":"Special","src":"assets/photos/photo_17.jpg"},{"id":19,"en":"Parking Bay","ku":"شوێنی پارککردن","category":"Parking","src":"assets/photos/photo_19.jpg"},{"id":20,"en":"Accessible Parking","ku":"پارکینگی تایبەت","category":"Parking","src":"assets/photos/photo_20.jpg"},{"id":21,"en":"Bicycle Symbol","ku":"نیشانەی پاسکیل","category":"Symbols","src":"assets/photos/photo_21.jpg"},{"id":22,"en":"SLOW","ku":"SLOW","category":"Words","src":"assets/photos/photo_22.jpg"},{"id":23,"en":"BUS","ku":"BUS","category":"Words","src":"assets/photos/photo_23.jpg"},{"id":24,"en":"TAXI","ku":"TAXI","category":"Words","src":"assets/photos/photo_24.jpg"},{"id":25,"en":"KEEP CLEAR","ku":"KEEP CLEAR","category":"Words","src":"assets/photos/photo_25.jpg"}];
const BUILT_IN_GALLERY=Array.isArray(window.GALLERY_DATA)&&window.GALLERY_DATA.length?window.GALLERY_DATA:FALLBACK_GALLERY;
let G=[...BUILT_IN_GALLERY];
const V=document.getElementById('view'),M=document.getElementById('modalRoot');
const S={get(k,d=null){try{return JSON.parse(localStorage.getItem('ks_'+k))??d}catch(e){return d}},set(k,v){localStorage.setItem('ks_'+k,JSON.stringify(v))}};
let state={view:'home',chapter:null,gallery:'All',tool:'calc',installPrompt:null};
let pendingGalleryPhoto=null;

const GALLERY_DB_NAME='ks-roadmark-gallery';
const GALLERY_DB_STORE='photos';
function openGalleryDB(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}
    const request=indexedDB.open(GALLERY_DB_NAME,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(GALLERY_DB_STORE))db.createObjectStore(GALLERY_DB_STORE,{keyPath:'id'})
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('Gallery database error'))
  })
}
async function galleryDBAction(mode,action){
  const db=await openGalleryDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(GALLERY_DB_STORE,mode),store=tx.objectStore(GALLERY_DB_STORE);
    let request;
    try{request=action(store)}catch(error){db.close();reject(error);return}
    tx.oncomplete=()=>{db.close();resolve(request?.result)};
    tx.onerror=()=>{db.close();reject(tx.error||request?.error||new Error('Gallery database error'))};
    tx.onabort=()=>{db.close();reject(tx.error||new Error('Gallery database aborted'))}
  })
}
async function loadCustomGallery(){
  try{
    const photos=await galleryDBAction('readonly',store=>store.getAll());
    const custom=Array.isArray(photos)?photos.sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)):[];
    G=[...BUILT_IN_GALLERY,...custom];
    if(state.view==='gallery')galleryView(state.gallery);
    else if(state.view==='home')home()
  }catch(error){console.warn('Custom gallery could not be loaded',error)}
}

// خەمڵاندنی مەیدانی: ئەم نرخانە preset ـی پلانکردنن، نە ستانداردی گشتی.
// TDS/Specification ـی بەرهەمی بەکارهاتوو هەمیشە پێشترە.
const PAINT_COVERAGE_PRESETS={
  thermo:{ku:'سێرمۆ (Thermoplastic)',en:'Thermoplastic',rate:3.70,thickness:'2.0 mm',beads:0.45,waste:5,thinner:false,hardener:false},
  coldAcrylic:{ku:'بۆیاخی سارد ئەکریلیک',en:'Cold Acrylic',rate:0.63,thickness:'0.40 mm',beads:0.35,waste:5,thinner:true,hardener:false},
  waterAcrylic:{ku:'ئەکریلیکی بنەمای ئاو',en:'Water-Based Acrylic',rate:0.63,thickness:'0.40 mm',beads:0.35,waste:5,thinner:false,hardener:false},
  mma:{ku:'MMA / Cold Plastic',en:'MMA / Cold Plastic',rate:3.00,thickness:'1.8–2.0 mm',beads:0.45,waste:5,thinner:false,hardener:true},
  twoK:{ku:'بۆیاخی دوو کۆمپۆنێت',en:'2K Thin Film',rate:0.60,thickness:'0.40 mm',beads:0.35,waste:5,thinner:false,hardener:true}
};
const SURFACE_COVERAGE_FACTORS={
  smoothAsphalt:{ku:'ئاسفاڵتی نوێ / نەرم',en:'Smooth Asphalt',factor:1.00},
  roughAsphalt:{ku:'ئاسفاڵتی کۆن / زبر',en:'Rough Asphalt',factor:1.10},
  concrete:{ku:'کۆنکریت',en:'Concrete',factor:1.08},
  pavers:{ku:'کەلەبستۆن / بەردی ڕێگا',en:'Pavers / Cobblestone',factor:1.20}
};

const GALLERY_CATEGORY_LABELS={
  All:'هەموو وێنەکان',
  Arrows:'تیرەکان',
  Parking:'پارکینگ',
  Words:'نووسینەکانی سەر شەقام',
  'Give Way':'پێش دەست / Give Way',
  Crossing:'پەڕینەوەی هاوڵاتی',
  Special:'نیشانە تایبەتەکان',
  Symbols:'هێماکان',
  Lines:'هێڵەکان',
  Numbers:'ژمارەکان',
  Other:'هی تر'
};
const GALLERY_CATEGORY_ORDER=['All','Arrows','Give Way','Crossing','Parking','Words','Symbols','Special','Lines','Numbers','Other'];
function galleryCategories(){
  let available=new Set(G.filter(Boolean).map(x=>x.category||'Other'));
  let ordered=GALLERY_CATEGORY_ORDER.filter(c=>c==='All'||available.has(c));
  let extras=[...available].filter(c=>!GALLERY_CATEGORY_ORDER.includes(c)).sort();
  return [...ordered,...extras]
}
function galleryCategoryLabel(c){return GALLERY_CATEGORY_LABELS[c]||c}
function galleryCategoryCount(c){return c==='All'?G.length:G.filter(x=>x&&x.category===c).length}

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function toast(t){let e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);requestAnimationFrame(()=>e.classList.add('show'));setTimeout(()=>{e.classList.remove('show');setTimeout(()=>e.remove(),300)},1800)}
function setNav(v){state.view=v;$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}
function applySettings(){let theme=S.get('theme','dark'),fs=S.get('font',1),lh=S.get('lh',1.95);document.body.classList.toggle('light',theme==='light');document.documentElement.style.setProperty('--fontScale',fs);document.documentElement.style.setProperty('--lineHeight',lh)}

(function(){
  if(document.getElementById('ks-v8-ui'))return;
  const s=document.createElement('style');s.id='ks-v8-ui';s.textContent=`
  .v8-hero{position:relative;overflow:hidden;border:1px solid #4d420e;border-radius:28px;padding:20px;background:
    radial-gradient(circle at 10% 0%,rgba(255,196,0,.18),transparent 33%),
    linear-gradient(145deg,#151714 0%,#0a0b0b 70%);box-shadow:0 22px 65px #0007}
  .v8-hero:after{content:"";position:absolute;left:-60px;bottom:-95px;width:250px;height:250px;border:22px solid rgba(255,196,0,.055);border-radius:50%;pointer-events:none}
  .v8-hero-top{position:relative;z-index:1;display:flex;align-items:center;gap:16px}
  .v8-logo{width:92px;height:92px;border-radius:50%;object-fit:cover;border:2px solid #806600;box-shadow:0 12px 35px #000}
  .v8-hero-brand{min-width:0}.v8-eyebrow{display:block;color:var(--yellow);font-size:10px;font-weight:900;letter-spacing:1.5px;direction:ltr;text-align:right}
  .v8-hero h1{font-size:24px;line-height:1.45;margin:5px 0 4px}.v8-hero p{margin:0;color:#bfc5c2;font-size:12px;line-height:1.7}
  .v8-hero-actions{position:relative;z-index:1;display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:9px;margin-top:20px}
  .v8-action{border:1px solid #303432;background:#171919;color:var(--text);border-radius:17px;padding:13px 10px;text-align:right;cursor:pointer}
  .v8-action span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#242520;color:var(--yellow);font-size:19px;margin-bottom:9px}
  .v8-action b{display:block;font-size:12px}.v8-action small{display:block;color:var(--muted);font-size:9px;margin-top:3px}
  .v8-action.primary{background:var(--yellow);color:#111;border-color:var(--yellow)}.v8-action.primary span{background:#111;color:var(--yellow)}.v8-action.primary small{color:#403500}
  .v8-status-strip{position:relative;z-index:1;display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid #2a2e2d}
  .v8-status-strip span{font-size:9px;color:var(--muted);background:#111313;border:1px solid #292d2b;border-radius:999px;padding:6px 9px}.v8-status-strip b{color:#fff;direction:ltr}
  .v8-status-strip .v8-online{color:#7de49e}
  .v8-section-title{display:flex;justify-content:space-between;align-items:end;gap:10px;margin:25px 2px 11px}.v8-section-title>div>span{display:block;font-size:9px;color:var(--yellow);font-weight:900}
  .v8-section-title h2{font-size:18px;margin:3px 0 0}.v8-section-title>small{color:var(--muted);font-size:10px}.v8-link{border:0;background:transparent;color:var(--yellow);font-size:10px;font-weight:900;cursor:pointer}
  .v8-resume{display:grid;grid-template-columns:58px 1fr auto;gap:12px;align-items:center;background:linear-gradient(135deg,var(--panel),#171810);border:1px solid #4a4219;border-radius:18px;padding:12px;cursor:pointer}
  .v8-progress-ring{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--yellow) var(--p),#2c302e 0);position:relative}
  .v8-progress-ring:after{content:"";position:absolute;inset:6px;background:var(--panel);border-radius:50%}.v8-progress-ring b{z-index:1;color:var(--yellow);font-size:10px;direction:ltr}
  .v8-resume-text b{display:block;font-size:13px}.v8-resume-text small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.v8-arrow{color:var(--yellow);font-size:28px}
  .v8-tools-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.v8-tools-grid button{border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:16px;padding:13px 8px;cursor:pointer}
  .v8-tools-grid i{display:grid;place-items:center;width:35px;height:35px;margin:0 auto 8px;border-radius:10px;background:#242100;color:var(--yellow);font-style:normal;font-size:18px}.v8-tools-grid b{display:block;font-size:11px}.v8-tools-grid small{display:block;color:var(--muted);font-size:8px;margin-top:3px}
  .v8-category-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.v8-category-grid button{min-width:0;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:16px;padding:12px 8px;text-align:center;cursor:pointer}
  .v8-cat-icon{display:grid;place-items:center;width:38px;height:38px;margin:0 auto 8px;background:#222300;border:1px solid #4a430c;color:var(--yellow);border-radius:11px;font-weight:1000;direction:ltr}
  .v8-category-grid b{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v8-category-grid small{display:block;color:var(--muted);font-size:8px;margin-top:4px}
  .v8-chapters .chapter-card{background:linear-gradient(135deg,var(--panel),var(--panel2))}
  .v8-gallery-head{display:grid;grid-template-columns:1fr auto;align-items:center;gap:15px;background:linear-gradient(135deg,#171912,#0c0d0d);border:1px solid #4f4516;border-radius:22px;padding:18px;margin-bottom:12px}
  .v8-gallery-head h1{font-size:22px;margin:4px 0 5px}.v8-gallery-head p{font-size:10px;color:var(--muted);line-height:1.7;margin:0}
  .v8-gallery-count{width:67px;height:67px;border-radius:18px;background:var(--yellow);color:#111;display:grid;place-items:center;align-content:center;direction:ltr}.v8-gallery-count b{font-size:23px;line-height:1}.v8-gallery-count small{font-size:8px;margin-top:4px;direction:rtl}
  .v8-gallery-add{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:10px;font-size:13px}.v8-gallery-add small{font-size:9px;font-weight:500;opacity:.72}
  .v8-gallery-search{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:15px;padding:4px 11px;margin-bottom:10px}.v8-gallery-search:focus-within{border-color:#7a6500}
  .v8-gallery-search span{color:var(--yellow);font-size:19px}.v8-gallery-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--text);padding:11px 0;font-size:12px}
  .v8-gallery-tabs{margin-bottom:8px}.v8-gallery-tabs .chip{display:flex;align-items:center;gap:6px}.v8-gallery-tabs .chip em{font-style:normal;font-size:8px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#252928;display:grid;place-items:center;direction:ltr}.v8-gallery-tabs .chip.active em{background:#111;color:var(--yellow)}
  .v8-gallery-subhead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:12px 2px}.v8-gallery-subhead b{display:block;font-size:13px}.v8-gallery-subhead small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.v8-gallery-subhead button{border:0;background:transparent;color:var(--yellow);font-size:9px}
  .v8-gallery-grid{gap:11px}.v8-photo-card{border-radius:18px;transition:.18s transform,.18s border-color;overflow:hidden}.v8-photo-card:active{transform:scale(.985)}
  .v8-photo-wrap{position:relative;overflow:hidden;background:linear-gradient(145deg,#111313,#070808)}.v8-photo-card img{aspect-ratio:4/3;object-fit:contain;padding:5px;transition:.25s transform}.v8-photo-card:hover img{transform:scale(1.018)}
  .v8-photo-num{position:absolute;top:8px;left:8px;background:#000b;color:#fff;border:1px solid #ffffff29;border-radius:8px;padding:4px 6px;font-size:8px;direction:ltr}
  .v8-photo-badge{position:absolute;right:8px;bottom:8px;background:#ffc400e8;color:#111;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:900;box-shadow:0 3px 12px #0007}
  .v8-photo-card .cap{padding:10px 11px 11px}.v8-photo-card .cap b{font-size:11px;line-height:1.45}.v8-photo-card .cap small{font-size:8px;margin-top:5px}
  .v8-photo-modal .modal-head>div{min-width:0}.v8-photo-modal .modal-head b{display:block;font-size:14px;margin-top:6px}.v8-photo-modal .modal-head small{display:block;color:var(--muted);font-size:9px;direction:ltr;margin-top:3px}
  .v8-modal-badge{display:inline-block;background:#272300;color:var(--yellow);border:1px solid #4d4306;border-radius:999px;padding:4px 7px;font-size:8px}
  .v8-modal-nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;margin-top:10px}.v8-modal-nav button{border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:11px;padding:9px;font-size:10px}.v8-modal-nav span{font-size:9px;color:var(--muted);direction:ltr}
  .v8-upload-picker{display:block;width:100%;color:var(--text);font-family:inherit;border:2px dashed #625616;background:#13150f;border-radius:17px;padding:18px;text-align:center;cursor:pointer;margin-bottom:12px}.v8-upload-picker span{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 9px;border-radius:14px;background:var(--yellow);color:#111;font-size:25px}.v8-upload-picker b{display:block;font-size:13px}.v8-upload-picker small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.v8-file-input{position:fixed;left:-9999px;width:1px;height:1px;opacity:0}
  .v8-upload-preview{display:none;width:100%;max-height:42vh;object-fit:contain;background:#070808;border:1px solid var(--line);border-radius:15px;margin-bottom:12px}.v8-upload-preview.ready{display:block}
  .v8-upload-note{font-size:9px;color:var(--muted);line-height:1.7;background:#111313;border:1px solid var(--line);border-radius:12px;padding:9px 11px;margin:10px 0}.v8-upload-actions{display:grid;grid-template-columns:1.3fr .7fr;gap:8px}.v8-upload-actions button{width:100%}

  .v82-manager-hero{border:1px solid #514615;border-radius:24px;padding:20px;background:
    radial-gradient(circle at 0 0,rgba(255,196,0,.17),transparent 36%),linear-gradient(145deg,#171912,#0b0c0c);margin-bottom:13px}
  .v82-manager-hero h1{font-size:23px;margin:5px 0}.v82-manager-hero p{color:var(--muted);font-size:11px;line-height:1.8;margin:0}
  .v82-manager-status{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}.v82-manager-status span{border:1px solid #343733;background:#111313;border-radius:999px;padding:6px 9px;font-size:9px;color:#cbd0ce}
  .v82-manager-status .ready{color:#82e7a0}
  .v82-manager-card{border:1px solid var(--line);background:linear-gradient(135deg,var(--panel),#111313);border-radius:19px;padding:15px;margin:10px 0}
  .v82-manager-card h3{font-size:14px;margin:0 0 5px}.v82-manager-card p{font-size:10px;color:var(--muted);line-height:1.8;margin:0 0 10px}
  .v82-manager-card textarea{width:100%;min-height:125px;resize:vertical;background:#090a0a;color:var(--text);border:1px solid #343836;border-radius:14px;padding:12px;outline:0;font:inherit;font-size:12px;line-height:1.8}
  .v82-manager-card textarea:focus{border-color:#806900}
  .v82-manager-actions{display:grid;grid-template-columns:1.25fr 1fr;gap:8px;margin-top:9px}
  .v82-manager-actions button{border-radius:13px;padding:12px 10px;font-weight:900;font-size:11px;cursor:pointer}
  .v82-manager-primary{background:var(--yellow);color:#111;border:1px solid var(--yellow)}
  .v82-manager-secondary{background:#191b1b;color:#fff;border:1px solid #343837}
  .v82-manager-list{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
  .v82-manager-list div{border:1px solid var(--line);background:#111313;border-radius:14px;padding:11px}.v82-manager-list b{display:block;font-size:10px}.v82-manager-list small{display:block;color:var(--muted);font-size:8px;margin-top:4px}
  .bottom-nav button[data-view="manager"] span{color:var(--yellow)}

  @media(max-width:650px){
    .v8-hero{padding:16px;border-radius:22px}.v8-logo{width:72px;height:72px}.v8-hero h1{font-size:19px}.v8-hero p{font-size:10px}
    .v8-hero-actions{grid-template-columns:1.35fr 1fr 1fr}.v8-action{padding:11px 8px}.v8-action b{font-size:10px}.v8-action small{font-size:8px}
    .v8-tools-grid,.v8-category-grid{grid-template-columns:repeat(2,1fr)}
    .v8-gallery-head{padding:15px}.v8-gallery-head h1{font-size:19px}.v8-gallery-count{width:58px;height:58px}.v8-gallery-count b{font-size:20px}
    .v8-gallery-grid{grid-template-columns:repeat(2,1fr)}
  }
  @media(min-width:720px){
    .v8-category-grid{grid-template-columns:repeat(7,1fr)}.v8-gallery-grid{grid-template-columns:repeat(3,1fr)}
  }`;
  document.head.appendChild(s)
})();

applySettings();
document.body.dataset.ksVersion='8.1';
const brandBtn=$('.brand');
if(brandBtn){
  brandBtn.innerHTML='<img src="icon-192.png" alt="KS" style="width:100%;height:100%;display:block;object-fit:cover;border-radius:11px">';
  brandBtn.style.padding='0';
  brandBtn.style.overflow='hidden';
  brandBtn.style.background='#0a0b0b';
}
$('#brandTitle').textContent=B.meta.title;
function updateOnline(){let on=navigator.onLine;$('#statusLine').textContent=on?'Online • Offline-ready':'Offline mode';$('#statusLine').style.color=on?'':'var(--yellow)'}window.addEventListener('online',updateOnline);window.addEventListener('offline',updateOnline);updateOnline();
function saveLast(id,pct=0){S.set('last',{id,pct,at:Date.now()});let pr=S.get('progress',{});pr[id]=Math.max(pr[id]||0,pct);S.set('progress',pr)}
function home(){
  cleanupReader();setNav('home');state.chapter=null;
  let last=S.get('last'),fav=S.get('fav',[]),pr=S.get('progress',{});
  let lastC=last&&B.chapters.find(c=>c.id===last.id);
  let done=Object.values(pr).filter(v=>v>=95).length;
  let cats=['Arrows','Parking','Words','Crossing','Give Way','Special','Symbols'].filter(c=>G.some(x=>x&&x.category===c));

  V.innerHTML=`
  <section class="v8-hero">
    <div class="v8-hero-top">
      <img class="v8-logo" src="icon-512.png" alt="KS">
      <div class="v8-hero-brand">
        <span class="v8-eyebrow">KS ROAD MARKING</span>
        <h1>${esc(B.meta.title)}</h1>
        <p>${esc(B.meta.subtitle)}</p>
      </div>
    </div>
    <div class="v8-hero-actions">
      <button class="v8-action primary" onclick="bookView()"><span>▤</span><b>کتێبەکە بکەرەوە</b><small>بەش و بابەتەکان</small></button>
      <button class="v8-action" onclick="toolsView('calc')"><span>▦</span><b>هەژمارکەر</b><small>بۆیاخ و ڕووبەر</small></button>
      <button class="v8-action" onclick="galleryView()"><span>▧</span><b>کاتالۆگی وێنە</b><small>${G.length} وێنە</small></button>
    </div>
    <div class="v8-status-strip">
      <span><b>${B.meta.chapters}</b> بەش</span>
      <span><b>${G.length}</b> وێنە</span>
      <span><b>${done}</b> تەواوکراو</span>
      <span class="v8-online">● Offline-ready</span>
    </div>
  </section>

  ${lastC?`
  <div class="v8-section-title"><div><span>بەردەوامبە</span><h2>دوایین خوێندنەوەت</h2></div><small>${Math.round(last.pct||0)}%</small></div>
  <div class="v8-resume" onclick="openChapter(${lastC.id},true)">
    <div class="v8-progress-ring" style="--p:${Math.round(last.pct||0)}%"><b>${Math.round(last.pct||0)}%</b></div>
    <div class="v8-resume-text"><b>${esc(lastC.title)}</b><small>کلیک بکە و لە هەمان شوێن بەردەوامبە</small></div>
    <span class="v8-arrow">‹</span>
  </div>`:''}

  <div class="v8-section-title"><div><span>دەستگەیشتنی خێرا</span><h2>ئامرازە مەیدانییەکان</h2></div></div>
  <div class="v8-tools-grid">
    <button onclick="toolsView('check')"><i>✓</i><b>Checklist</b><small>QC / HSE</small></button>
    <button onclick="toolsView('standards')"><i>§</i><b>ستانداردەکان</b><small>EN / Iraqi</small></button>
    <button onclick="searchView()"><i>⌕</i><b>گەڕان</b><small>لە کتێبەکەدا</small></button>
    <button onclick="toolsView('project')"><i>Σ</i><b>پڕۆژە</b><small>کۆی ماددە</small></button>
    <button onclick="managerView()"><i>✦</i><b>کاروان</b><small>بەڕێوەبەری ئەپ</small></button>
  </div>

  <div class="v8-section-title"><div><span>کاتالۆگ</span><h2>وێنەکان بە پۆل</h2></div><button class="v8-link" onclick="galleryView()">هەمووی ببینە</button></div>
  <div class="v8-category-grid">
    ${cats.map(c=>`<button onclick="galleryView(decodeURIComponent('${encodeURIComponent(c)}'))"><span class="v8-cat-icon">${c==='Arrows'?'➜':c==='Parking'?'P':c==='Words'?'Aa':c==='Crossing'?'▥':c==='Give Way'?'▽':c==='Special'?'◇':'◎'}</span><b>${esc(galleryCategoryLabel(c))}</b><small>${galleryCategoryCount(c)} وێنە</small></button>`).join('')}
  </div>

  <div class="v8-section-title"><div><span>ناوەڕۆک</span><h2>بەشە سەرەکییەکان</h2></div><small>${fav.length} ★</small></div>
  <div class="chapter-list v8-chapters">${B.chapters.slice(0,6).map(c=>chapterCard(c,pr)).join('')}</div>
  `;
  window.scrollTo(0,0)
}
function chapterCard(c,pr=S.get('progress',{})){let f=S.get('fav',[]).includes(c.id),p=Math.round(pr[c.id]||0);return `<article class="chapter-card" onclick="openChapter(${c.id})"><span class="chap-num">${c.id}</span><div><b>${esc(c.title)}</b><small>${c.sections.length} بابەت • ${c.blocks.length} بەشەناوەڕۆک</small><div class="progress-mini"><i style="width:${p}%"></i></div></div><button class="star ${f?'on':''}" onclick="event.stopPropagation();toggleFav(${c.id},this)">★</button></article>`}
function toggleFav(id,el){let a=S.get('fav',[]),i=a.indexOf(id);if(i>=0)a.splice(i,1);else a.push(id);S.set('fav',a);if(el)el.classList.toggle('on',a.includes(id));toast(a.includes(id)?'زیادکرا بۆ دڵخوازەکان':'لابرا لە دڵخوازەکان')}
function bookView(){cleanupReader();setNav('book');let pr=S.get('progress',{}),fav=S.get('fav',[]);V.innerHTML=`<div class="section-head"><h2>کتێب</h2><span>${B.chapters.length} بەش + ${B.appendices.length} پاشکۆ</span></div><div class="panel" style="margin-bottom:12px"><button class="btn small" onclick="openPreface()">پێشەکی</button> <button class="btn small" onclick="showFavorites()">★ دڵخوازەکان (${fav.length})</button></div><div class="chapter-list">${B.chapters.map(c=>chapterCard(c,pr)).join('')}</div><div class="section-head"><h2>پاشکۆکان</h2><span>${B.appendices.length}</span></div><div class="chapter-list">${B.appendices.map(a=>`<article class="chapter-card" onclick="openAppendix(${a.id})"><span class="chap-num">+</span><div><b>${esc(a.title)}</b><small>${a.blocks.length} بەشەناوەڕۆک</small></div><span>‹</span></article>`).join('')}</div>`;window.scrollTo(0,0)}
function showFavorites(){let fav=S.get('fav',[]),pr=S.get('progress',{});V.innerHTML=`<div class="reader-top"><button class="btn small" onclick="bookView()">→ گەڕانەوە</button><h2 class="reader-title">★ دڵخوازەکان</h2></div><div class="chapter-list">${fav.length?B.chapters.filter(c=>fav.includes(c.id)).map(c=>chapterCard(c,pr)).join(''):'<div class="empty">هێشتا هیچ بەشێکت نیشانە نەکردووە.</div>'}</div>`}
function cleanupReader(){window.removeEventListener('scroll',readerScrollHandler);$('#readProgress i').style.width='0'}
function renderBlock(b,i){if(b.type==='table'){return `<div id="b-${i}" class="reader-block table-wrap"><table class="book-table">${b.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`}let txt=b.text.replace(/^[•·]\s*/,'');return `<p id="b-${i}" class="reader-block ${b.kind||'p'}">${esc(txt)}</p>`}
function openChapter(id,resume=false){cleanupReader();setNav('book');let c=B.chapters.find(x=>x.id===id);if(!c)return;state.chapter=id;let fav=S.get('fav',[]).includes(id),note=S.get('notes',{})[id]||'';V.innerHTML=`<div class="reader-top"><div class="reader-actions"><button class="btn small" onclick="bookView()">→ گەڕانەوە</button><button class="btn small" onclick="toggleFav(${id});openChapter(${id})">${fav?'★':'☆'} دڵخواز</button><button class="btn small" onclick="shareChapter(${id})">↗ Share</button></div><h2 class="reader-title">${esc(c.title)}</h2><div class="reader-meta">${c.sections.length} بابەت • ${c.blocks.length} بەشەناوەڕۆک</div>${c.sections.length?`<select class="section-jump" onchange="jumpToBlock(this.value)"><option value="">بڕۆ بۆ بابەت...</option>${c.sections.map(s=>`<option value="${s.block}">${esc(s.title)}</option>`).join('')}</select>`:''}</div><article class="reader">${c.blocks.map(renderBlock).join('')}</article><section class="notes panel"><b>تێبینی تایبەتی من</b><p style="color:var(--muted);font-size:11px">تێبینییەکان تەنها لەسەر ئامێرەکەت هەڵدەگیرێن.</p><textarea id="chapterNote" placeholder="تێبینی بنووسە...">${esc(note)}</textarea><button class="btn primary small" onclick="saveNote(${id})">هەڵگرتن</button></section>`;window.scrollTo(0,0);let last=S.get('last');if(resume&&last&&last.id===id)setTimeout(()=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(last.pct||0)/100),80);saveLast(id,last&&last.id===id?last.pct:0);window.addEventListener('scroll',readerScrollHandler,{passive:true})}
function openPreface(){cleanupReader();setNav('book');V.innerHTML=`<div class="reader-top"><button class="btn small" onclick="bookView()">→ گەڕانەوە</button><h2 class="reader-title">پێشەکی</h2></div><article class="reader">${B.preface.map((b,i)=>renderBlock({...b,kind:'p'},i)).join('')}</article>`;window.scrollTo(0,0)}
function openAppendix(id){cleanupReader();setNav('book');let a=B.appendices.find(x=>x.id===id);V.innerHTML=`<div class="reader-top"><button class="btn small" onclick="bookView()">→ گەڕانەوە</button><h2 class="reader-title">${esc(a.title)}</h2></div><article class="reader">${a.blocks.map(renderBlock).join('')}</article>`;window.scrollTo(0,0)}
let rsTick=false;function readerScrollHandler(){if(!state.chapter||rsTick)return;rsTick=true;requestAnimationFrame(()=>{let h=document.documentElement.scrollHeight-innerHeight,p=h>0?Math.max(0,Math.min(100,scrollY/h*100)):0;$('#readProgress i').style.width=p+'%';saveLast(state.chapter,p);rsTick=false})}
function jumpToBlock(i){if(i==='')return;document.getElementById('b-'+i)?.scrollIntoView({behavior:'smooth',block:'start'})}
function saveNote(id){let n=S.get('notes',{});n[id]=$('#chapterNote').value;S.set('notes',n);toast('تێبینی هەڵگیرا')}
async function shareChapter(id){let c=B.chapters.find(x=>x.id===id),text=`${c.title} — ${B.meta.title}`;if(navigator.share){try{await navigator.share({title:B.meta.title,text})}catch(e){}}else{navigator.clipboard?.writeText(text);toast('کۆپی کرا')}}
function galleryView(cat=state.gallery){
  cleanupReader();setNav('gallery');state.gallery=cat||'All';
  let cats=galleryCategories();
  if(!cats.includes(state.gallery))state.gallery='All';
  let items=state.gallery==='All'?G:G.filter(x=>x.category===state.gallery);

  V.innerHTML=`
  <section class="v8-gallery-head">
    <div>
      <span class="v8-eyebrow">ROAD MARKING CATALOG</span>
      <h1>کاتالۆگی وێنەکان</h1>
      <p>وێنە بەردەستەکان بە پۆل ڕێکخراون؛ گەڕان بکە یان پۆلێک هەڵبژێرە.</p>
    </div>
    <div class="v8-gallery-count"><b id="galleryCount">${items.length}</b><small>وێنە</small></div>
  </section>

  <button type="button" id="galleryAddButton" data-gallery-action="add" class="btn primary v8-gallery-add"><span>＋</span><b>وێنە زیاد بکە</b><small>لە مۆبایل یان کامێراوە</small></button>

  <div class="v8-gallery-search">
    <span>⌕</span>
    <input id="gallerySearchInput" type="search" placeholder="گەڕان... Arrow, Parking, Zebra, STOP" oninput="filterGallery(this.value)">
  </div>

  <div class="gallery-tabs v8-gallery-tabs">
    ${cats.map(c=>`<button class="chip ${c===state.gallery?'active':''}" onclick="galleryView(decodeURIComponent('${encodeURIComponent(c)}'))">${esc(galleryCategoryLabel(c))}<em>${galleryCategoryCount(c)}</em></button>`).join('')}
  </div>

  <div class="v8-gallery-subhead">
    <div><b>${esc(galleryCategoryLabel(state.gallery))}</b><small id="galleryVisibleCount">${items.length} وێنە لەم پۆلەدا</small></div>
    <button onclick="galleryView('All')">پاککردنەوەی فلتەر</button>
  </div>

  <div class="gallery-grid v8-gallery-grid" id="galleryGrid">
    ${items.map((p,i)=>`
      <article class="photo-card v8-photo-card" data-search="${esc((p.ku+' '+p.en+' '+p.category).toLowerCase())}" onclick='showPhoto(${JSON.stringify(p.id)})'>
        <div class="v8-photo-wrap">
          <img loading="${i<4?'eager':'lazy'}" decoding="async" src="${p.src}" alt="${esc(p.ku)} — ${esc(p.en)}" onerror="handleGalleryImageError(this)">
          <span class="v8-photo-num">#${String(i+1).padStart(2,'0')}</span>
          <span class="v8-photo-badge">${esc(galleryCategoryLabel(p.category))}</span>
        </div>
        <div class="cap">
          <b>${esc(p.ku)}</b>
          <small>${esc(p.en)}</small>
        </div>
      </article>`).join('')}
  </div>
  <div class="empty" id="galleryEmpty" style="display:none">هیچ وێنەیەک بەم ناوە نەدۆزرایەوە.</div>`;
  window.scrollTo(0,0)
}
function filterGallery(q){
  q=(q||'').trim().toLowerCase();
  let cards=$$('#galleryGrid .v8-photo-card'),shown=0;
  cards.forEach(card=>{let ok=!q||card.dataset.search.includes(q);card.style.display=ok?'':'none';if(ok)shown++});
  let c=$('#galleryCount');if(c)c.textContent=shown;
  let v=$('#galleryVisibleCount');if(v)v.textContent=shown+' وێنەی بەردەست';
  let e=$('#galleryEmpty');if(e)e.style.display=shown?'none':'block'
}
function handleGalleryImageError(img){
  let card=img?.closest('.v8-photo-card');if(card)card.remove();
  let shown=$('#galleryGrid .v8-photo-card').filter(x=>x.style.display!=='none').length;
  let c=$('#galleryCount');if(c)c.textContent=shown;
  let v=$('#galleryVisibleCount');if(v)v.textContent=shown+' وێنەی بەردەست';
  let e=$('#galleryEmpty');if(e)e.style.display=shown?'none':'block'
}
function addPhotoModal(){
  pendingGalleryPhoto=null;
  M.innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="modal-card">
    <div class="modal-head"><div><span class="v8-modal-badge">وێنەی نوێ</span><b>زیادکردنی وێنە بۆ کاتالۆگ</b></div><button onclick="closeModal()">×</button></div>
    <input id="galleryPhotoInput" class="v8-file-input" type="file" accept="image/*">
    <label for="galleryPhotoInput" class="v8-upload-picker"><span>＋</span><b>وێنە هەڵبژێرە</b><small>لە گەلەری یان کامێرای مۆبایلەکەت</small></label>
    <img id="galleryPhotoPreview" class="v8-upload-preview" alt="پێشبینینی وێنە">
    <div class="form-grid">
      <div class="field"><label>ناوی کوردی *</label><input id="galleryPhotoKu" placeholder="نموونە: تیری ئاراستەی ڕاست"></div>
      <div class="field"><label>English name</label><input id="galleryPhotoEn" class="ltr" placeholder="Straight Arrow"></div>
      <div class="field" style="grid-column:1/-1"><label>پۆلی وێنە</label><select id="galleryPhotoCategory">${GALLERY_CATEGORY_ORDER.filter(c=>c!=='All').map(c=>`<option value="${esc(c)}">${esc(galleryCategoryLabel(c))}</option>`).join('')}</select></div>
    </div>
    <div class="v8-upload-note">وێنەکە بچووک دەکرێتەوە و لەسەر هەمان ئامێرەکەت پارێزراو دەبێت؛ لە کاتی Offline ـیش بەردەستە.</div>
    <div class="v8-upload-actions"><button id="galleryPhotoSave" class="btn primary" onclick="saveGalleryPhoto()">هەڵگرتنی وێنە</button><button class="btn" onclick="closeModal()">پاشگەزبوونەوە</button></div>
  </div></div>`
}
function openGalleryPhotoPicker(){
  const input=$('#galleryPhotoInput');
  if(!input){toast('تکایە دووبارە هەوڵ بدەرەوە');return}
  input.value='';
  input.click()
}
function fileToGalleryDataURL(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type.startsWith('image/')){reject(new Error('invalid-type'));return}
    if(file.size>20*1024*1024){reject(new Error('too-large'));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('read-failed'));
    reader.onload=()=>{
      const image=new Image();
      image.onerror=()=>reject(new Error('decode-failed'));
      image.onload=()=>{
        const maxSide=1600,scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
        const width=Math.max(1,Math.round(image.naturalWidth*scale)),height=Math.max(1,Math.round(image.naturalHeight*scale));
        const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
        const ctx=canvas.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,width,height);ctx.drawImage(image,0,0,width,height);
        try{resolve(canvas.toDataURL('image/jpeg',.84))}catch(error){reject(error)}
      };
      image.src=reader.result
    };
    reader.readAsDataURL(file)
  })
}
async function previewGalleryPhoto(input){
  const file=input?.files?.[0];if(!file)return;
  const picker=M.querySelector('.v8-upload-picker'),preview=$('#galleryPhotoPreview');
  if(picker){picker.querySelector('b').textContent='وێنەکە ئامادە دەکرێت...';picker.style.pointerEvents='none'}
  try{
    pendingGalleryPhoto=await fileToGalleryDataURL(file);
    preview.src=pendingGalleryPhoto;preview.classList.add('ready');
    const base=file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();
    if(!$('#galleryPhotoKu').value)$('#galleryPhotoKu').value=base;
    if(!$('#galleryPhotoEn').value)$('#galleryPhotoEn').value=base;
    if(picker){picker.querySelector('b').textContent='گۆڕینی وێنە';picker.querySelector('small').textContent=file.name}
  }catch(error){
    pendingGalleryPhoto=null;preview.classList.remove('ready');input.value='';
    toast(error.message==='too-large'?'قەبارەی وێنەکە زۆر گەورەیە':'ئەم جۆرە وێنەیە نەخوێندرایەوە')
  }finally{if(picker)picker.style.pointerEvents=''}
}
async function saveGalleryPhoto(){
  const ku=($('#galleryPhotoKu')?.value||'').trim(),en=($('#galleryPhotoEn')?.value||'').trim(),category=$('#galleryPhotoCategory')?.value||'Other';
  if(!pendingGalleryPhoto){toast('سەرەتا وێنەیەک هەڵبژێرە');return}
  if(!ku){toast('ناوی کوردی بنووسە');$('#galleryPhotoKu')?.focus();return}
  const button=$('#galleryPhotoSave');if(button){button.disabled=true;button.textContent='هەڵدەگیرێت...'}
  const now=Date.now(),id='custom-'+now+'-'+Math.random().toString(36).slice(2,8);
  const photo={id,ku,en:en||ku,category,src:pendingGalleryPhoto,custom:true,createdAt:now};
  try{
    await galleryDBAction('readwrite',store=>store.put(photo));
    G.push(photo);pendingGalleryPhoto=null;closeModal();state.gallery=category;galleryView(category);toast('وێنەکە زیاد کرا ✓')
  }catch(error){
    console.error(error);toast('وێنەکە هەڵنەگیرا؛ بۆشایی ئامێرەکەت بپشکنە');
    if(button){button.disabled=false;button.textContent='هەڵگرتنی وێنە'}
  }
}
async function deleteCustomPhoto(id){
  const photo=G.find(x=>x.id===id);if(!photo?.custom)return;
  if(!confirm('دڵنیایت لە سڕینەوەی ئەم وێنەیە؟'))return;
  try{
    await galleryDBAction('readwrite',store=>store.delete(id));
    G=G.filter(x=>x.id!==id);closeModal();galleryView(state.gallery);toast('وێنەکە سڕایەوە')
  }catch(error){toast('وێنەکە نەسڕایەوە')}
}
function showPhoto(id){
  let p=G.find(x=>x.id===id);if(!p)return;
  let idx=G.findIndex(x=>x.id===id),prev=G[(idx-1+G.length)%G.length],next=G[(idx+1)%G.length];
  M.innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="modal-card v8-photo-modal">
    <div class="modal-head">
      <div><span class="v8-modal-badge">${esc(galleryCategoryLabel(p.category))}</span><b>${esc(p.ku)}</b><small>${esc(p.en)}</small></div>
      <button onclick="closeModal()">×</button>
    </div>
    <img src="${p.src}" alt="${esc(p.en)}">
    <div class="v8-modal-nav">
      <button onclick='showPhoto(${JSON.stringify(prev.id)})'>→ پێشوو</button>
      <span>${idx+1} / ${G.length}</span>
      <button onclick='showPhoto(${JSON.stringify(next.id)})'>دواتر ←</button>
    </div>
    ${p.custom?`<button class="btn danger small" style="width:100%;margin-top:9px" onclick='deleteCustomPhoto(${JSON.stringify(p.id)})'>سڕینەوەی ئەم وێنەیە</button>`:''}
  </div></div>`
}
function closeModal(){pendingGalleryPhoto=null;M.innerHTML=''}
function toolsView(tab=state.tool){cleanupReader();setNav('tools');state.tool=tab;let tabs=[['calc','هەژمارکەر'],['project','پڕۆژە'],['check','Checklist'],['standards','ستاندارد'],['docs','فایلەکان']];V.innerHTML=`<div class="section-head"><h2>ئامرازە مەیدانییەکان</h2><span>Field Toolkit</span></div><div class="tool-tabs">${tabs.map(([k,l])=>`<button class="chip ${k===tab?'active':''}" onclick="toolsView('${k}')">${l}</button>`).join('')}</div><div id="toolBody"></div>`;({calc:calcTool,project:projectTool,check:checkTool,standards:standardsTool,docs:docsTool}[tab]||calcTool)();window.scrollTo(0,0)}
function calcTool(){let t=$('#toolBody');t.innerHTML=`<div class="panel"><div class="tool-tabs"><button class="chip active" data-calc="coverage">خەمڵاندنی بۆیاخ</button><button class="chip" data-calc="line">هێڵی بەردەوام</button><button class="chip" data-calc="broken">هێڵی پچڕاو</button><button class="chip" data-calc="zebra">زێبرا</button><button class="chip" data-calc="mix">2K Mix</button></div><div id="calcBody"></div></div>`;$$('[data-calc]').forEach(b=>b.onclick=()=>{$$('[data-calc]').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderCalc(b.dataset.calc)});renderCalc('coverage')}
function num(id){return +document.getElementById(id)?.value||0}function resultCard(label,val,unit=''){return `<div class="result"><span>${label}</span><b>${Number(val).toFixed(2)} ${unit}</b></div>`}
function renderCalc(type){let c=$('#calcBody');if(type==='coverage'){c.innerHTML=`<div class="form-grid" style="margin-top:12px"><div class="field"><label>جۆری بۆیاخ</label><select id="paintType" onchange="syncCoverageDefaults();doCoverageCalc()"><option value="thermo">سێرمۆ (Thermoplastic)</option><option value="coldAcrylic">بۆیاخی سارد ئەکریلیک</option><option value="waterAcrylic">ئەکریلیکی بنەمای ئاو</option><option value="mma">MMA / Cold Plastic</option><option value="twoK">بۆیاخی دوو کۆمپۆنێت</option></select></div><div class="field"><label>جۆری ڕووی شەقام</label><select id="surfaceType" onchange="doCoverageCalc()"><option value="smoothAsphalt">ئاسفاڵتی نوێ / نەرم</option><option value="roughAsphalt">ئاسفاڵتی کۆن / زبر</option><option value="concrete">کۆنکریت</option><option value="pavers">کەلەبستۆن / بەردی ڕێگا</option></select></div><div class="field"><label>بڕی بۆیاخ (kg)</label><input class="ltr" id="paintKg" type="number" min="0" step="0.1" value="25" oninput="doCoverageCalc()"></div><div class="field"><label>Waste %</label><input class="ltr" id="coverageWaste" type="number" min="0" step="0.5" value="5" oninput="doCoverageCalc()"></div><div class="field"><label>Glass Beads (kg/m²)</label><input class="ltr" id="coverageBeads" type="number" min="0" step="0.05" value="0.45" oninput="doCoverageCalc()"></div><div class="field" id="thinnerField" style="display:none"><label>Thinner % — تەنها ئەگەر TDS ڕێگە بدات</label><input class="ltr" id="coverageThinner" type="number" min="0" step="0.5" value="0" oninput="doCoverageCalc()"></div><div class="field" id="hardenerField" style="display:none"><label>Hardener % — لە TDS وەربگرە</label><input class="ltr" id="coverageHardener" type="number" min="0" step="0.1" placeholder="TDS" oninput="doCoverageCalc()"></div></div><div class="results" id="calcResults"></div><div class="panel" id="coverageNote" style="margin-top:12px;font-size:11px;color:var(--muted);line-height:1.8"></div>`;syncCoverageDefaults();doCoverageCalc()}else if(type==='line'){c.innerHTML=`<div class="form-grid" style="margin-top:12px"><div class="field"><label>درێژی (m)</label><input class="ltr" id="l" type="number" value="1000"></div><div class="field"><label>پانی (cm)</label><input class="ltr" id="w" type="number" value="15"></div><div class="field"><label>ڕێژەی ماددە (kg/m²)</label><input class="ltr" id="r" type="number" step=".01" value="4"></div><div class="field"><label>Glass Beads (kg/m²)</label><input class="ltr" id="g" type="number" step=".01" value="0.45"></div><div class="field"><label>Waste %</label><input class="ltr" id="x" type="number" value="5"></div></div><button class="btn primary" style="margin-top:10px" onclick="doLineCalc()">هەژمارکردن</button><div class="results" id="calcResults"></div><div id="addProject"></div>`;doLineCalc()}else if(type==='broken'){c.innerHTML=`<div class="form-grid" style="margin-top:12px"><div class="field"><label>کۆی درێژی (m)</label><input class="ltr" id="bl" type="number" value="1000"></div><div class="field"><label>Mark (m)</label><input class="ltr" id="bm" type="number" value="3"></div><div class="field"><label>Gap (m)</label><input class="ltr" id="bg" type="number" value="9"></div><div class="field"><label>پانی (cm)</label><input class="ltr" id="bw" type="number" value="15"></div><div class="field"><label>ڕێژەی ماددە (kg/m²)</label><input class="ltr" id="br" type="number" value="4"></div><div class="field"><label>Glass Beads (kg/m²)</label><input class="ltr" id="bb" type="number" value="0.45"></div></div><button class="btn primary" style="margin-top:10px" onclick="doBrokenCalc()">هەژمارکردن</button><div class="results" id="calcResults"></div>`;doBrokenCalc()}else if(type==='zebra'){c.innerHTML=`<div class="form-grid" style="margin-top:12px"><div class="field"><label>ژمارەی Stripe</label><input class="ltr" id="zn" type="number" value="8"></div><div class="field"><label>پانی Stripe (m)</label><input class="ltr" id="zw" type="number" step=".01" value="0.5"></div><div class="field"><label>درێژی Stripe (m)</label><input class="ltr" id="zl" type="number" step=".01" value="4"></div><div class="field"><label>ڕێژەی ماددە (kg/m²)</label><input class="ltr" id="zr" type="number" value="4"></div><div class="field"><label>Glass Beads (kg/m²)</label><input class="ltr" id="zb" type="number" step=".01" value="0.45"></div></div><button class="btn primary" style="margin-top:10px" onclick="doZebraCalc()">هەژمارکردن</button><div class="results" id="calcResults"></div>`;doZebraCalc()}else{c.innerHTML=`<div class="form-grid" style="margin-top:12px"><div class="field"><label>کۆی Mix (kg)</label><input class="ltr" id="mt" type="number" value="450"></div><div class="field"><label>Base Parts</label><input class="ltr" id="mp" type="number" value="98"></div><div class="field"><label>Hardener Parts</label><input class="ltr" id="mh" type="number" value="2"></div></div><button class="btn primary" style="margin-top:10px" onclick="doMixCalc()">هەژمارکردن</button><div class="results" id="calcResults"></div><p style="font-size:11px;color:var(--muted)">ڕێژەی Mix دەبێت لە TDS ـی بەرهەمەکە وەربگیرێت؛ 98:2 تەنها نموونەی هەژمارە.</p>`;doMixCalc()}}
function syncCoverageDefaults(){let p=PAINT_COVERAGE_PRESETS[$('#paintType')?.value]||PAINT_COVERAGE_PRESETS.thermo;if($('#coverageWaste'))$('#coverageWaste').value=p.waste;if($('#coverageBeads'))$('#coverageBeads').value=p.beads;if($('#coverageThinner'))$('#coverageThinner').value=0;if($('#coverageHardener'))$('#coverageHardener').value='';if($('#thinnerField'))$('#thinnerField').style.display=p.thinner?'block':'none';if($('#hardenerField'))$('#hardenerField').style.display=p.hardener?'block':'none'}
function doCoverageCalc(){let p=PAINT_COVERAGE_PRESETS[$('#paintType')?.value]||PAINT_COVERAGE_PRESETS.thermo,s=SURFACE_COVERAGE_FACTORS[$('#surfaceType')?.value]||SURFACE_COVERAGE_FACTORS.smoothAsphalt,rate=p.rate*s.factor,m2kg=rate>0?1/rate:0,kg=Math.max(0,num('paintKg')),totalM2=kg*m2kg,wastePct=Math.max(0,num('coverageWaste')),beadsRate=Math.max(0,num('coverageBeads')),beadsKg=totalM2*beadsRate,wasteKg=kg*wastePct/100,purchaseKg=kg+wasteKg,thinPct=p.thinner?Math.max(0,num('coverageThinner')):0,thinKg=kg*thinPct/100,hardRaw=$('#coverageHardener')?.value,hardPct=p.hardener&&hardRaw!==''?Math.max(0,+hardRaw||0):null,hardKg=hardPct===null?null:kg*hardPct/100;let html=resultCard('1 kg بۆیاخ',m2kg,'m²')+resultCard(`${kg.toFixed(1)} kg بۆیاخ`,totalM2,'m²')+resultCard('خەمڵاندنی بەکارهێنان',rate,'kg/m²')+resultCard('Glass Beads',beadsKg,'kg')+resultCard(`Waste (${wastePct.toFixed(1)}%)`,wasteKg,'kg')+resultCard('بڕی بۆیاخ لەگەڵ Waste',purchaseKg,'kg');if(p.thinner)html+=resultCard(`Thinner (${thinPct.toFixed(1)}%)`,thinKg,'kg');else html+=resultCard('Thinner',0,'kg');if(p.hardener){html+=hardKg===null?`<div class="result"><span>Hardener</span><b style="font-size:17px">TDS</b></div>`:resultCard(`Hardener (${hardPct.toFixed(1)}%)`,hardKg,'kg')}else html+=resultCard('Hardener',0,'kg');html+=`<div class="result"><span>ئەستووری پێش‌گریمان</span><b style="font-size:17px">${p.thickness}</b></div>`;$('#calcResults').innerHTML=html;let safety=p.hardener?'Hardener ـی MMA/2K ڕێژەی گشتی نییە؛ % ـەکە لە TDS ـی هەمان بەرهەمەوە داخڵ بکە. ':'';let thinNote=p.thinner?'Thinner بە بنەڕەت 0% دانراوە؛ تەنها ئەگەر TDS ڕێگە بدات زیاد بکە. ':'';$('#coverageNote').innerHTML=`<b style="color:var(--text)">${esc(p.ku)} — ${esc(s.ku)}</b><br>${kg.toFixed(1)} kg لەم خەمڵاندنەدا نزیکەی <b style="color:var(--yellow)">${totalM2.toFixed(2)} m²</b> ڕووپەڕ دەگرێت. Glass Beads ـی خەمڵێنراو: <b>${beadsKg.toFixed(2)} kg</b>.<br>${thinNote}${safety}Waste ـی ${wastePct.toFixed(1)}% تەنها زیادەی پلانکردنە، نە ستانداردی گشتی. نرخەکانی Beads و Coverage preset ـی پلانکردنن؛ TDS/Specification ـی پڕۆژە سەرچاوەی کۆتایین.`}
function doLineCalc(){let A=num('l')*num('w')/100,M=A*num('r'),G=A*num('g'),P=M*(1+num('x')/100);$('#calcResults').innerHTML=resultCard('ڕووبەر',A,'m²')+resultCard('ماددە',M,'kg')+resultCard('Glass Beads',G,'kg')+resultCard('کڕین + Waste',P,'kg');$('#addProject').innerHTML=`<button class="btn small" style="margin-top:10px" onclick="addProjectItem('هێڵی بەردەوام',${A},${M},${G})">+ زیادکردن بۆ پڕۆژە</button>`}
function doBrokenCalc(){let L=num('bl'),m=num('bm'),g=num('bg'),cycle=m+g,full=Math.floor(L/cycle),rem=L-full*cycle,paint=full*m+Math.min(rem,m),A=paint*num('bw')/100,M=A*num('br'),B=A*num('bb');$('#calcResults').innerHTML=resultCard('درێژی بۆیاخکراو',paint,'m')+resultCard('ڕووبەر',A,'m²')+resultCard('ماددە',M,'kg')+resultCard('Glass Beads',B,'kg')}
function doZebraCalc(){let A=num('zn')*num('zw')*num('zl'),M=A*num('zr'),B=A*num('zb');$('#calcResults').innerHTML=resultCard('ڕووبەر واقعی',A,'m²')+resultCard('ماددە',M,'kg')+resultCard('Glass Beads',B,'kg')}
function doMixCalc(){let T=num('mt'),p=num('mp'),h=num('mh'),sum=p+h,base=T*p/sum,hard=T*h/sum;$('#calcResults').innerHTML=resultCard('Base',base,'kg')+resultCard('Hardener',hard,'kg')}
function addProjectItem(name,area,material,beads){let a=S.get('project',[]);a.push({id:Date.now(),name,area,material,beads});S.set('project',a);toast('زیادکرا بۆ پڕۆژە')}
function projectTool(){let a=S.get('project',[]),tot=a.reduce((o,x)=>({area:o.area+x.area,material:o.material+x.material,beads:o.beads+x.beads}),{area:0,material:0,beads:0});$('#toolBody').innerHTML=`<div class="panel"><b>Project Estimator</b><p style="font-size:11px;color:var(--muted)">لە هەژمارکەرەوە ئایتم زیاد بکە و کۆی ماددەکان ببینە.</p><div class="results">${resultCard('کۆی ڕووبەر',tot.area,'m²')}${resultCard('کۆی ماددە',tot.material,'kg')}${resultCard('کۆی Beads',tot.beads,'kg')}</div><div class="project-list" style="margin-top:12px">${a.length?a.map(x=>`<div class="project-item"><div><b>${esc(x.name)}</b><small>${x.area.toFixed(2)} m² • ${x.material.toFixed(2)} kg • ${x.beads.toFixed(2)} kg beads</small></div><button class="btn small danger" onclick="removeProjectItem(${x.id})">×</button></div>`).join(''):'<div class="empty">هێشتا ئایتم نییە.</div>'}</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn small" onclick="exportProject()">Export CSV</button><button class="btn small danger" onclick="clearProject()">پاککردنەوە</button></div></div>`}
function removeProjectItem(id){S.set('project',S.get('project',[]).filter(x=>x.id!==id));projectTool()}function clearProject(){if(confirm('هەموو ئایتمەکان بسڕدرێنەوە؟')){S.set('project',[]);projectTool()}}function exportProject(){let a=S.get('project',[]);let csv='Name,Area_m2,Material_kg,GlassBeads_kg\n'+a.map(x=>`"${x.name}",${x.area},${x.material},${x.beads}`).join('\n');let u=URL.createObjectURL(new Blob([csv],{type:'text/csv'})),el=document.createElement('a');el.href=u;el.download='Road_Marking_Project_Estimate.csv';el.click();URL.revokeObjectURL(u)}
function checkTool(){let type=S.get('checkType','project');let labels={project:'پڕۆژە',qc:'QC',hse:'HSE'},done=S.get('checks_'+type,{});$('#toolBody').innerHTML=`<div class="panel"><div class="tool-tabs">${Object.keys(labels).map(k=>`<button class="chip ${k===type?'active':''}" onclick="S.set('checkType','${k}');checkTool()">${labels[k]}</button>`).join('')}</div><div class="checklist" style="margin-top:12px">${B.checklists[type].map((x,i)=>`<label class="check ${done[i]?'done':''}"><input type="checkbox" ${done[i]?'checked':''} onchange="setCheck('${type}',${i},this.checked)"><span>${esc(x)}</span></label>`).join('')}</div><button class="btn small danger" style="margin-top:10px" onclick="resetChecks('${type}')">Reset</button></div>`}
function setCheck(t,i,v){let d=S.get('checks_'+t,{});d[i]=v;S.set('checks_'+t,d);checkTool()}function resetChecks(t){S.set('checks_'+t,{});checkTool()}
function standardsTool(){$('#toolBody').innerHTML=`<div class="standards">${B.standards.map(s=>`<div class="standard"><div><b>${esc(s.name)}</b><p>${esc(s.desc)}</p></div><em>${esc(s.year)}</em></div>`).join('')}</div><div class="panel" style="margin-top:10px;font-size:11px;color:var(--muted)">لە پڕۆژەی ڕاستەقینەدا هەمیشە وەشان، Amendment و Specification ـی پڕۆژە پشکنە.</div>`}
function docsTool(){$('#toolBody').innerHTML=`<div class="docs"><a class="doc-card" href="assets/docs/engineering_drawings.pdf" target="_blank"><i>▧</i><b>Engineering Drawings</b><small>PDF</small></a><a class="doc-card" href="assets/docs/book_drawings.pdf" target="_blank"><i>▤</i><b>Book Drawings</b><small>PDF</small></a></div><div class="panel" style="margin-top:10px"><b>Offline Mode</b><p style="font-size:11px;color:var(--muted);line-height:1.7">دوای دامەزراندنی PWA، ناوەڕۆکی کتێب و فایلە سەرەکییەکان بێ ئینتەرنێت بەردەستن.</p></div>`}
let searchTimer;function searchView(q=''){cleanupReader();setNav('search');V.innerHTML=`<div class="searchbar"><input class="search-input" id="globalSearch" placeholder="گەڕان لە هەموو کتێب... Thermoplastic، Zebra، EN 1436" value="${esc(q)}"></div><div id="searchResults"></div>`;let e=$('#globalSearch');e.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>runSearch(e.value),160)});runSearch(q);setTimeout(()=>e.focus(),50);window.scrollTo(0,0)}
function flatText(b){return b.type==='p'?b.text:b.rows.flat().join(' ')}function runSearch(q){let root=$('#searchResults');q=q.trim();if(q.length<2){root.innerHTML='<div class="empty">لانیکەم دوو پیت بنووسە.</div>';return}let qq=q.toLowerCase(),hits=[];for(let c of B.chapters){for(let i=0;i<c.blocks.length;i++){let t=flatText(c.blocks[i]);if(t.toLowerCase().includes(qq)){hits.push({c,i,t});if(hits.length>=60)break}}if(hits.length>=60)break}root.innerHTML=hits.length?hits.map(h=>{let idx=h.t.toLowerCase().indexOf(qq),st=Math.max(0,idx-65),sn=h.t.slice(st,idx+q.length+100),safe=esc(sn),re=new RegExp(escReg(q),'ig');safe=safe.replace(re,m=>`<mark>${m}</mark>`);return `<article class="search-result" onclick="openChapterAt(${h.c.id},${h.i})"><b>${esc(h.c.title)}</b><p>${safe}</p></article>`}).join(''):'<div class="empty">هیچ ئەنجامێک نەدۆزرایەوە.</div>'}
function escReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}function openChapterAt(id,i){openChapter(id);setTimeout(()=>jumpToBlock(i),100)}

function injectManagerNav(){
  let nav=document.querySelector('.bottom-nav');
  if(!nav||nav.querySelector('[data-view="manager"]'))return;
  let b=document.createElement('button');
  b.dataset.view='manager';
  b.innerHTML='<span>✦</span><small>کاروان</small>';
  nav.appendChild(b);
}
function managerView(){
  cleanupReader();setNav('manager');
  V.innerHTML=`
  <section class="v82-manager-hero">
    <span class="v8-eyebrow">KS APP MANAGER</span>
    <h1>کاروان / بەڕێوەبەری ئەپ</h1>
    <p>لەوێ داواکارییەکەت بنووسە. دوگمەکە دەقەکە کۆپی دەکات و ChatGPT دەکاتەوە تا گۆڕانکارییەکەت پێ بسپێریت.</p>
    <div class="v82-manager-status">
      <span class="ready">● کاروان ئامادەیە</span>
      <span>KS Road Marking</span>
      <span>GitHub + Vercel</span>
    </div>
  </section>

  <section class="v82-manager-card">
    <h3>چی دەتەوێت بگۆڕدرێت؟</h3>
    <p>نموونە: «وێنەی نوێ زیاد بکە»، «هەژمارکەر چاک بکە»، «بەشێکی نوێ بۆ ستانداردەکان زیاد بکە».</p>
    <textarea id="managerRequest" placeholder="داواکاری گۆڕانکارییەکەت لێرە بنووسە..."></textarea>
    <div class="v82-manager-actions">
      <button class="v82-manager-primary" onclick="sendManagerRequest()">کۆپی + کردنەوەی ChatGPT</button>
      <button class="v82-manager-secondary" onclick="openChatGPT()">تەنها ChatGPT بکەرەوە</button>
    </div>
  </section>

  <section class="v82-manager-card">
    <h3>کارەکانی کە دەتوانرێت بەڕێوەببرێن</h3>
    <div class="v82-manager-list">
      <div><b>سەرەتا و دیزاین</b><small>Home, menu, layout</small></div>
      <div><b>کاتالۆگی وێنە</b><small>Photos, categories</small></div>
      <div><b>هەژمارکەر</b><small>Paint, beads, waste</small></div>
      <div><b>کتێب و دەق</b><small>Chapters, standards</small></div>
      <div><b>فایل و کۆد</b><small>GitHub repository</small></div>
      <div><b>بڵاوکردنەوە</b><small>Vercel deployment</small></div>
    </div>
  </section>

  <section class="v82-manager-card">
    <h3>تێبینی</h3>
    <p>ئەم بەشە API بەکارناهێنێت، بۆیە خەرجی API نییە. بۆ ئەوەی ChatGPT بتوانێت فایلەکانی GitHub ڕاستەوخۆ بگۆڕێت، پەیوەندی GitHub و مۆڵەتی نووسین پێویستە.</p>
  </section>`;
  window.scrollTo(0,0)
}
function openChatGPT(){
  window.open('https://chatgpt.com/','_blank','noopener,noreferrer');
}
async function sendManagerRequest(){
  let el=$('#managerRequest'),q=(el?.value||'').trim();
  if(!q){toast('سەرەتا داواکارییەکەت بنووسە');el?.focus();return}
  let text=`KS Road Marking App — داواکاری گۆڕانکاری:\n${q}\n\nProject: karwan-road-marking-app\nApp: https://karwan-road-marking-app.vercel.app/`;
  try{
    await navigator.clipboard.writeText(text);
    toast('داواکاری کۆپی کرا');
  }catch(e){
    let t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('داواکاری کۆپی کرا')
  }
  setTimeout(()=>openChatGPT(),250)
}

function settingsModal(){let theme=S.get('theme','dark'),font=S.get('font',1),lh=S.get('lh',1.95);M.innerHTML=`<div class="modal" onclick="if(event.target===this)closeModal()"><div class="modal-card"><div class="modal-head"><b>ڕێکخستنەکان</b><button onclick="closeModal()">×</button></div><div class="settings-row"><span>ڕووکار</span><div class="switch"><button class="${theme==='dark'?'active':''}" onclick="S.set('theme','dark');applySettings();settingsModal()">Dark</button><button class="${theme==='light'?'active':''}" onclick="S.set('theme','light');applySettings();settingsModal()">Light</button></div></div><div class="settings-row"><span>قەبارەی نووسین</span><div class="switch"><button onclick="setFont(-.08)">A−</button><button>${font.toFixed(2)}</button><button onclick="setFont(.08)">A+</button></div></div><div class="settings-row"><span>دووری نێوان دێڕەکان</span><div class="switch"><button onclick="setLH(-.1)">−</button><button>${lh.toFixed(2)}</button><button onclick="setLH(.1)">+</button></div></div><div class="settings-row"><span>دامەزراندنی ئەپ</span><button class="btn primary small" onclick="installApp()">Install</button></div><div class="settings-row"><span>پاککردنەوەی Notes / Progress</span><button class="btn danger small" onclick="resetAppData()">Reset</button></div></div></div>`}
function setFont(d){S.set('font',Math.max(.8,Math.min(1.45,S.get('font',1)+d)));applySettings();settingsModal()}function setLH(d){S.set('lh',Math.max(1.5,Math.min(2.4,S.get('lh',1.95)+d)));applySettings();settingsModal()}function resetAppData(){if(confirm('هەموو Progress، Favorites، Notes و Project data بسڕدرێنەوە؟')){Object.keys(localStorage).filter(k=>k.startsWith('ks_')).forEach(k=>localStorage.removeItem(k));applySettings();closeModal();home();toast('Data reset')}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;$('#installTop').style.display='block'});async function installApp(){if(state.installPrompt){state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null}else{toast('لە Chrome: Menu → Add to Home screen / Install app')}}
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-gallery-action]')?.dataset.galleryAction;
  if(action==='add'){event.preventDefault();addPhotoModal()}
});
document.addEventListener('change',event=>{
  if(event.target?.id==='galleryPhotoInput')previewGalleryPhoto(event.target)
});
injectManagerNav();$$('.bottom-nav button').forEach(b=>b.onclick=()=>({home,book:bookView,gallery:galleryView,tools:toolsView,search:searchView,manager:managerView}[b.dataset.view]||home)());$$('[data-action="home"]').forEach(b=>b.onclick=home);$$('[data-action="settings"]').forEach(b=>b.onclick=settingsModal);$$('[data-action="install"]').forEach(b=>b.onclick=installApp);
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('service-worker.js').catch(()=>{});home();loadCustomGallery();
