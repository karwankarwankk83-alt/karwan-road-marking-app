(()=>{
const collator=new Intl.Collator('ckb-IQ',{usage:'sort',sensitivity:'base',numeric:true});
function cleanName(row){
  const b=row.querySelector('b');
  if(!b)return '';
  const clone=b.cloneNode(true);
  clone.querySelectorAll('.admin-order-num').forEach(e=>e.remove());
  return clone.textContent.replace(/^[🟢⚪\s]*(?:چالاک|ناچالاک)?\s*[—-]?\s*/,'').trim();
}
function renumberAndSort(container,rowSelector){
  if(!container)return;
  const rows=[...container.querySelectorAll(`:scope > ${rowSelector}`)];
  if(rows.length<1)return;
  rows.sort((a,b)=>collator.compare(cleanName(a),cleanName(b)));
  rows.forEach((row,i)=>{
    const b=row.querySelector('b');
    if(b){
      let n=b.querySelector('.admin-order-num');
      if(!n){n=document.createElement('span');n.className='admin-order-num';b.prepend(n);}
      n.textContent=`${i+1}. `;
    }
    container.appendChild(row);
  });
}
function apply(){
  renumberAndSort(document.querySelector('#rdDeviceList'),'.device-row');
  renumberAndSort(document.querySelector('#rdUserList'),'.role-item');
}
let busy=false;
const obs=new MutationObserver(()=>{
  if(busy)return;
  busy=true;
  requestAnimationFrame(()=>{apply();busy=false;});
});
function init(){
  const s=document.createElement('style');
  s.textContent='.admin-order-num{font-weight:900;margin-left:4px}';
  document.head.appendChild(s);
  obs.observe(document.body,{childList:true,subtree:true});
  apply();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

// Register and actively refresh the PWA service worker so future production updates
// reach already-installed copies without asking staff to reinstall every time.
if('serviceWorker' in navigator){
  let swReloading=false;
  const reloadForNewWorker=()=>{
    if(swReloading)return;
    swReloading=true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange',reloadForNewWorker);
  const updateWorker=async()=>{
    try{
      const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      await reg.update();
    }catch(e){console.warn('PWA update check failed',e);}
  };
  window.addEventListener('load',updateWorker,{once:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateWorker();});
  setInterval(()=>{if(!document.hidden)updateWorker();},5*60*1000);
}
})();