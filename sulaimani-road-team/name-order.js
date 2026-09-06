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
})();