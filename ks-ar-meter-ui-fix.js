/* KS AR Meter UI fix */
(()=>{
function wire(){const launch=document.querySelector('#ksArLaunch'),overlay=document.querySelector('#ksArOverlay'),stop=document.querySelector('#ksArStop'),back=document.querySelector('#ksArBack');if(!launch||!overlay||launch.dataset.arwired)return;launch.dataset.arwired='1';launch.addEventListener('click',()=>{overlay.style.display='block'});stop?.addEventListener('click',()=>{overlay.style.display='none'});back?.addEventListener('click',()=>{overlay.style.display='none'})}
new MutationObserver(()=>wire()).observe(document.documentElement,{childList:true,subtree:true});setTimeout(wire,200)
})();