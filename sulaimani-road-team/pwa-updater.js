(()=>{
const BUILD='32';
if(!('serviceWorker' in navigator))return;
let reloading=false;
function reloadOnce(){
  if(reloading)return;
  if(sessionStorage.getItem('team-paint-sw-reloaded-'+BUILD)==='1')return;
  reloading=true;
  sessionStorage.setItem('team-paint-sw-reloaded-'+BUILD,'1');
  location.reload();
}
async function ensureFresh(){
  try{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
    await reg.update();
    if(reg.waiting){
      try{reg.waiting.postMessage({type:'SKIP_WAITING'});}catch(_){ }
    }
  }catch(e){console.warn('PWA updater',e);}
}
navigator.serviceWorker.addEventListener('controllerchange',reloadOnce);
window.addEventListener('load',ensureFresh,{once:true});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureFresh();});
setInterval(()=>{if(!document.hidden)ensureFresh();},5*60*1000);
})();
