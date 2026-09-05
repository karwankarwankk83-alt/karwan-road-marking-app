const materials=['بۆیاخ','گڵاسپید','هاردنەر','تەنەر','تیپ','ڕۆڵە','فڵچە','گاز','بەنزین','گریس','غاز'];
const units=['kg','L','دانە','ڕۆڵ'];
const statusText={draft:'پاشەکەوتکراو',submitted:'چاوەڕێی پەسەند',approved:'پەسەندکراو',returned:'گەڕێندراوەتەوە'};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let editingId=null, approvalRecordId=null, editUnlockedUntil=0, pendingPinAction=null;

function materialRows(){
  $('#materialList').innerHTML='';
  materials.forEach((m,i)=>{
    const row=document.createElement('div'); row.className='material-row'; row.dataset.material=m;
    row.innerHTML=`<div class="material-name">${m}</div><input type="number" step="0.01" min="0" name="mat-${i}" placeholder="بڕ"><select name="unit-${i}">${units.map(u=>`<option>${u}</option>`).join('')}</select>`;
    $('#materialList').appendChild(row);
  });
}
materialRows();

const dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open('sulaimani-road-team',2);
  req.onupgradeneeded=e=>{
    const db=e.target.result;
    if(!db.objectStoreNames.contains('records')){const s=db.createObjectStore('records',{keyPath:'id'});s.createIndex('date','date');s.createIndex('status','status');}
  };
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
});
async function allRecords(){const db=await dbPromise;return new Promise((res,rej)=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.createdAt-a.createdAt));r.onerror=()=>rej(r.error)})}
async function getRecord(id){const db=await dbPromise;return new Promise((res,rej)=>{const r=db.transaction('records').objectStore('records').get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function putRecord(record){const db=await dbPromise;return new Promise((res,rej)=>{const r=db.transaction('records','readwrite').objectStore('records').put(record);r.onsuccess=()=>res(record);r.onerror=()=>rej(r.error)})}
async function deleteRecord(id){const db=await dbPromise;return new Promise((res,rej)=>{const r=db.transaction('records','readwrite').objectStore('records').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}

async function hashPin(pin){const bytes=new TextEncoder().encode(pin);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function pinKey(role){return `srt-pin-${role}`}
async function setPin(role,label){
  openPin(`دانانی ${label}`,'کۆدێکی نوێ دابنێ. باشترە لانیکەم ٤ ژمارە بێت.',async pin=>{
    if(pin.length<4){alert('کۆدەکە دەبێت لانیکەم ٤ ژمارە بێت');return false}
    localStorage.setItem(pinKey(role),await hashPin(pin));alert(`${label} دانرا`);return true;
  });
}
async function verifyPin(role,pin){const saved=localStorage.getItem(pinKey(role));if(!saved)return null;return saved===await hashPin(pin)}
function openPin(title,help,action){$('#pinTitle').textContent=title;$('#pinHelp').textContent=help;$('#pinInput').value='';pendingPinAction=action;$('#pinModal').classList.remove('hidden');setTimeout(()=>$('#pinInput').focus(),50)}
function closeModal(id){$('#'+id).classList.add('hidden')}
$$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
$('#pinConfirm').onclick=async()=>{const pin=$('#pinInput').value.trim();if(!pin)return;const ok=await pendingPinAction?.(pin);if(ok!==false)closeModal('pinModal')};

function editIsUnlocked(){return Date.now()<editUnlockedUntil}
function setEditState(open){
  if(open) editUnlockedUntil=Date.now()+10*60*1000;
  else editUnlockedUntil=0;
  const unlocked=editIsUnlocked();
  $('#workFields').disabled=!unlocked;
  $('#editLockBadge').textContent=unlocked?'🔓 دەسەڵات کراوە':'🔒 پارێزراو';
  $('#editLockBadge').className='badge '+(unlocked?'open':'locked');
  $('#unlockEdit').textContent=unlocked?'🔒 داخستنی دەسەڵات':'🔑 کردنەوەی دەسەڵاتی تۆمارکردن';
}
$('#unlockEdit').onclick=async()=>{
  if(editIsUnlocked()){setEditState(false);return}
  if(!localStorage.getItem(pinKey('admin'))){await setPin('admin','کۆدی دەستکاری');return}
  openPin('دەسەڵاتی تۆمارکردن','کۆدی دەستکاری بنووسە.',async pin=>{
    if(await verifyPin('admin',pin)){setEditState(true);return true} alert('کۆد هەڵەیە');return false;
  });
};

function nextRecordNo(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(Date.now()).slice(-5)}`}
function resetForm(){editingId=null;$('#workForm').reset();$('[name=date]').value=new Date().toISOString().slice(0,10);$('[name=recordNo]').value=nextRecordNo();materialRows()}
resetForm(); setEditState(false);

function collectMaterials(){return materials.map((name,i)=>({name,quantity:Number($(`[name="mat-${i}"]`).value||0),unit:$(`[name="unit-${i}"]`).value})).filter(x=>x.quantity>0)}
async function filesFromForm(fd){const keys=['photoBefore','photoDuring','photoAfter'],out={};for(const k of keys){const f=fd.get(k);if(f&&f.size)out[k]={name:f.name,type:f.type,size:f.size,blob:f}}return out}
async function buildRecord(statusOverride){
  const fd=new FormData($('#workForm')); const old=editingId?await getRecord(editingId):null;
  const photos=await filesFromForm(fd);
  return {
    id:editingId||crypto.randomUUID(),recordNo:fd.get('recordNo')||nextRecordNo(),date:fd.get('date'),startTime:fd.get('startTime'),endTime:fd.get('endTime'),location:fd.get('location'),type:fd.get('type'),paintType:fd.get('paintType'),color:fd.get('color'),length:Number(fd.get('length')||0),width:Number(fd.get('width')||0),area:Number(fd.get('area')||0),lat:fd.get('lat'),lng:fd.get('lng'),staff:fd.get('staff'),equipment:fd.get('equipment'),note:fd.get('note'),materials:collectMaterials(),photos:{...(old?.photos||{}),...photos},status:statusOverride||old?.status||'draft',approvals:statusOverride==='submitted'?[]:(old?.approvals||[]),createdAt:old?.createdAt||Date.now(),updatedAt:Date.now()
  };
}
$('#workForm').addEventListener('submit',async e=>{e.preventDefault();if(!editIsUnlocked())return alert('سەرەتا دەسەڵاتی تۆمارکردن بکەرەوە');const r=await buildRecord();if(editingId&&r.status==='approved'){r.status='draft';r.approvals=[]}await putRecord(r);alert('تۆمارەکە پاشەکەوت کرا');resetForm();await refresh()});
$('#submitApproval').onclick=async()=>{if(!editIsUnlocked())return alert('سەرەتا دەسەڵاتی تۆمارکردن بکەرەوە');const r=await buildRecord('submitted');await putRecord(r);alert('تۆمارەکە نێردرا بۆ پەسەندکردن');resetForm();await refresh()};

$('#getGps').onclick=()=>{if(!navigator.geolocation)return alert('GPS لەم ئامێرەدا بەردەست نییە');navigator.geolocation.getCurrentPosition(p=>{$('[name=lat]').value=p.coords.latitude.toFixed(6);$('[name=lng]').value=p.coords.longitude.toFixed(6)},()=>alert('نەتوانرا GPS وەربگیرێت. ڕێگەپێدانەکانی Location بپشکنە.'))};

async function editExisting(id){
  const go=async()=>{const r=await getRecord(id);if(!r)return;editingId=id;for(const k of ['recordNo','date','startTime','endTime','location','type','paintType','color','length','width','area','lat','lng','staff','equipment','note']){const el=$(`[name="${k}"]`);if(el)el.value=r[k]??''}materials.forEach((m,i)=>{const x=(r.materials||[]).find(v=>v.name===m);if(x){$(`[name="mat-${i}"]`).value=x.quantity;$(`[name="unit-${i}"]`).value=x.unit}});document.getElementById('newRecord').scrollIntoView({behavior:'smooth'})};
  if(editIsUnlocked())return go();
  if(!localStorage.getItem(pinKey('admin')))return setPin('admin','کۆدی دەستکاری');
  openPin('دەستکاریکردنی تۆمار','کۆدی دەستکاری بنووسە.',async pin=>{if(await verifyPin('admin',pin)){setEditState(true);await go();return true}alert('کۆد هەڵەیە');return false});
}
async function removeExisting(id){
  const action=async()=>{if(!confirm('دڵنیایت لە سڕینەوەی ئەم تۆمارە؟'))return;await deleteRecord(id);await refresh()};
  if(editIsUnlocked())return action();
  if(!localStorage.getItem(pinKey('admin')))return setPin('admin','کۆدی دەستکاری');
  openPin('سڕینەوەی تۆمار','کۆدی دەستکاری بنووسە.',async pin=>{if(await verifyPin('admin',pin)){await action();return true}alert('کۆد هەڵەیە');return false});
}
function openApproval(id){approvalRecordId=id;$('#approvalPin').value='';$('#approvalComment').value='';getRecord(id).then(r=>$('#approvalRecordTitle').textContent=`${r.recordNo} — ${r.location||''}`);$('#approvalModal').classList.remove('hidden')}
async function approvalAction(action){
  const role=$('#approvalRole').value,pin=$('#approvalPin').value.trim(),saved=localStorage.getItem(pinKey(role));
  if(!saved){closeModal('approvalModal');await setPin(role,role==='manager'?'کۆدی بەڕێوەبەر':'کۆدی سەرپەرشتیار');return}
  if(!await verifyPin(role,pin))return alert('کۆد هەڵەیە');
  const r=await getRecord(approvalRecordId);if(!r)return;
  const approval={role,action,comment:$('#approvalComment').value.trim(),at:Date.now()};r.approvals=[...(r.approvals||[]),approval];r.status=action==='return'?'returned':'approved';r.updatedAt=Date.now();await putRecord(r);closeModal('approvalModal');await refresh();alert(action==='return'?'تۆمارەکە گەڕێندرایەوە':'تۆمارەکە پەسەند کرا');
}
$('#approveBtn').onclick=()=>approvalAction('approve');$('#returnBtn').onclick=()=>approvalAction('return');

function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
async function renderRecords(filter=''){
  const records=await allRecords();const q=filter.trim().toLowerCase();const filtered=records.filter(r=>!q||[r.recordNo,r.location,r.type,r.date,statusText[r.status]].join(' ').toLowerCase().includes(q));
  $('#recordList').innerHTML=filtered.length?'':'<p class="muted">هێشتا هیچ تۆمارێک نییە.</p>';
  filtered.forEach(r=>{const d=document.createElement('div');d.className='record-card';d.innerHTML=`<div class="record-top"><h4>${esc(r.recordNo)} — ${esc(r.location||'شوێن دیاری نەکراوە')}</h4><span class="status ${r.status}">${statusText[r.status]||r.status}</span></div><div class="record-meta"><span>📅 ${esc(r.date||'')}</span><span>${esc(r.type||'')}</span><span>${Number(r.length||0).toFixed(2)} m</span><span>${Number(r.area||0).toFixed(2)} m²</span></div><div class="record-actions"><button data-edit="${r.id}">دەستکاری</button>${r.status==='submitted'||r.status==='returned'?`<button data-approve="${r.id}">پەسەند / گەڕاندنەوە</button>`:''}<button class="delete" data-delete="${r.id}">سڕینەوە</button></div>`;$('#recordList').appendChild(d)});
  $$('[data-edit]').forEach(b=>b.onclick=()=>editExisting(b.dataset.edit));$$('[data-delete]').forEach(b=>b.onclick=()=>removeExisting(b.dataset.delete));$$('[data-approve]').forEach(b=>b.onclick=()=>openApproval(b.dataset.approve));
}
$('#recordSearch').oninput=e=>renderRecords(e.target.value);

async function renderStats(){
  const r=await allRecords();$('#statRecords').textContent=r.length;$('#statLength').textContent=r.reduce((s,x)=>s+Number(x.length||0),0).toFixed(1);$('#statArea').textContent=r.reduce((s,x)=>s+Number(x.area||0),0).toFixed(1);$('#statApproved').textContent=r.filter(x=>x.status==='approved').length;
  const totals={};r.forEach(x=>(x.materials||[]).forEach(m=>{const k=`${m.name}|${m.unit}`;totals[k]=(totals[k]||0)+Number(m.quantity||0)}));$('#materialTotals').innerHTML=Object.keys(totals).length?'':'<p class="muted">هێشتا ماددەیەک تۆمار نەکراوە.</p>';Object.entries(totals).forEach(([k,v])=>{const [name,unit]=k.split('|');const d=document.createElement('div');d.className='stat-line';d.innerHTML=`<strong>${esc(name)}</strong><span>${v.toFixed(2)} ${esc(unit)}</span>`;$('#materialTotals').appendChild(d)});
  const gps=r.filter(x=>x.lat&&x.lng);$('#gpsList').innerHTML=gps.length?'':'<p class="muted">هێشتا GPS تۆمار نەکراوە.</p>';gps.forEach(x=>{const d=document.createElement('div');d.className='record-card';d.innerHTML=`<strong>${esc(x.location||x.recordNo)}</strong><div class="record-meta"><span>${esc(x.lat)}, ${esc(x.lng)}</span></div>`;$('#gpsList').appendChild(d)});
}
async function refresh(){await renderRecords($('#recordSearch').value||'');await renderStats()}
refresh();

$$('[data-section]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.section)?.scrollIntoView({behavior:'smooth'}));
$('#setAdminPin').onclick=()=>setPin('admin','کۆدی دەستکاری');$('#setSupervisorPin').onclick=()=>setPin('supervisor','کۆدی سەرپەرشتیار');$('#setManagerPin').onclick=()=>setPin('manager','کۆدی بەڕێوەبەر');

const assistant=$('#assistant');$('#assistantBtn').onclick=()=>assistant.classList.remove('hidden');$('#closeAssistant').onclick=()=>assistant.classList.add('hidden');function addMsg(text,cls){const d=document.createElement('div');d.className='msg '+cls;d.textContent=text;$('#chat').appendChild(d);$('#chat').scrollTop=$('#chat').scrollHeight}$('#sendChat').onclick=()=>{const i=$('#chatInput'),q=i.value.trim();if(!q)return;addMsg(q,'user');i.value='';setTimeout(()=>addMsg('یاریدەدەری AI لە دیزاینەکە ئامادەیە؛ پەیوەندی backend ـی پارێزراو هێشتا دەبێت زیاد بکرێت بۆ وەڵامی ڕاستەوخۆ.','bot'),200)};$('#chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#sendChat').click()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');