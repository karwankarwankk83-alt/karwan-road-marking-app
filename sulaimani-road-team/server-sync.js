(()=>{
const SUPABASE_URL='https://gandmxiegxzekdukpiqe.supabase.co';
const SUPABASE_KEY='sb_publishable_rX-VPhPgbjhzhpJ_iDcQzw_cdcY5VLz';
if(!window.supabase?.createClient){console.error('Supabase client not loaded');return;}
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const localAllRecords=allRecords, localGetRecord=getRecord, localPutRecord=putRecord, localDeleteRecord=deleteRecord;
let serverSession=null;
const photoKinds={photoBefore:'before',photoDuring:'during',photoAfter:'after'};

function injectServerUi(){
  const settings=document.querySelector('.settings'); if(!settings)return;
  const wrap=document.createElement('div'); wrap.className='server-status-wrap';
  wrap.innerHTML=`<button id="serverAccountBtn" type="button">☁️ سێرڤەر</button><span id="serverStatus" style="padding:10px;font-size:12px;font-weight:800">پشکنین...</span>`;
  settings.prepend(wrap);
  const modal=document.createElement('div'); modal.id='serverModal'; modal.className='modal hidden';
  modal.innerHTML=`<div class="modal-card"><button class="modal-close" id="serverClose">×</button><h3>☁️ پەیوەندی بە سێرڤەر</h3><p id="serverHelp">بچۆ ژوورەوە تا تۆمارەکان لە سێرڤەری ناوەندی هەڵبگیرێن.</p><label>ناوی تەواو<input id="serverName" autocomplete="name"></label><label>ئیمەیڵ<input id="serverEmail" type="email" autocomplete="email"></label><label>وشەی نهێنی<input id="serverPassword" type="password" autocomplete="current-password" minlength="6"></label><div class="action-row"><button id="serverLogin" class="primary" type="button">چوونەژوورەوە</button><button id="serverSignup" class="secondary" type="button">دروستکردنی هەژمار</button></div><button id="serverUploadLocal" class="secondary full" type="button" style="margin-top:8px">⬆️ ناردنی تۆمارە کۆنەکان بۆ سێرڤەر</button><button id="serverLogout" class="danger full" type="button" style="margin-top:8px">چوونەدەرەوە</button></div>`;
  document.body.appendChild(modal);
  document.querySelector('#serverAccountBtn').onclick=()=>modal.classList.remove('hidden');
  document.querySelector('#serverClose').onclick=()=>modal.classList.add('hidden');
  document.querySelector('#serverLogin').onclick=login;
  document.querySelector('#serverSignup').onclick=signup;
  document.querySelector('#serverLogout').onclick=logout;
  document.querySelector('#serverUploadLocal').onclick=uploadLocalRecords;
}

function setStatus(msg,ok=false){const el=document.querySelector('#serverStatus');if(el){el.textContent=msg;el.style.color=ok?'#216b3d':'#8c5b00';}}
async function updateSessionUi(){
  const {data:{session}}=await sb.auth.getSession(); serverSession=session;
  const help=document.querySelector('#serverHelp'), logout=document.querySelector('#serverLogout'), upload=document.querySelector('#serverUploadLocal');
  if(session){setStatus('☁️ پەیوەستە',true);if(help)help.textContent=`پەیوەستە: ${session.user.email||''}`;if(logout)logout.style.display='block';if(upload)upload.style.display='block';}
  else{setStatus('☁️ پەیوەست نییە');if(help)help.textContent='بچۆ ژوورەوە تا تۆمارەکان لە سێرڤەری ناوەندی هەڵبگیرێن.';if(logout)logout.style.display='none';if(upload)upload.style.display='none';}
}
async function login(){
  const email=document.querySelector('#serverEmail').value.trim(), password=document.querySelector('#serverPassword').value;
  if(!email||!password)return alert('ئیمەیڵ و وشەی نهێنی بنووسە');
  const {error}=await sb.auth.signInWithPassword({email,password}); if(error)return alert('هەڵە لە چوونەژوورەوە: '+error.message);
  await updateSessionUi(); await autoUploadMissingLocalRecords(); await refresh(); alert('بە سەرکەوتوویی پەیوەست بوویت بە سێرڤەر');
}
async function signup(){
  const full_name=document.querySelector('#serverName').value.trim(),email=document.querySelector('#serverEmail').value.trim(),password=document.querySelector('#serverPassword').value;
  if(!email||password.length<6)return alert('ئیمەیڵ و وشەی نهێنیی لانیکەم ٦ پیت/ژمارە بنووسە');
  const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name}}}); if(error)return alert('هەڵە لە دروستکردنی هەژمار: '+error.message);
  if(data.session){await updateSessionUi();await autoUploadMissingLocalRecords();await refresh();alert('هەژمارەکە دروست بوو و پەیوەست بوویت');}
  else alert('هەژمارەکە دروست بوو. ئەگەر ئیمەیڵی پشتڕاستکردنەوە هات، کرتەی لە لینکەکە بکە و پاشان بچۆ ژوورەوە.');
}
async function logout(){await sb.auth.signOut();serverSession=null;await updateSessionUi();await refresh();alert('لە سێرڤەر چوویتە دەرەوە؛ داتای ناوخۆی مۆبایل هەر ماوە.');}

function mapServer(r){
  const materials=(r.record_materials||[]).map(x=>({name:x.name,quantity:Number(x.quantity||0),unit:x.unit||''}));
  const approvals=(r.record_approvals||[]).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)).map(x=>({role:x.role,action:x.action,comment:x.comment||'',at:new Date(x.created_at).getTime()}));
  const photos={}; (r.record_photos||[]).forEach(x=>{const k=Object.keys(photoKinds).find(k=>photoKinds[k]===x.kind);if(k)photos[k]={name:x.file_name,type:x.mime_type,size:x.size_bytes,storagePath:x.storage_path};});
  return {id:r.id,recordNo:r.record_no,date:r.work_date,startTime:r.start_time||'',endTime:r.end_time||'',location:r.location||'',type:r.work_type||'',paintType:r.paint_type||'',color:r.color||'',length:Number(r.length_m||0),width:Number(r.width_cm||0),area:Number(r.area_m2||0),lat:r.latitude??'',lng:r.longitude??'',staff:r.staff||'',equipment:r.equipment||'',note:r.note||'',status:r.status||'draft',materials,approvals,photos,createdAt:new Date(r.created_at).getTime(),updatedAt:new Date(r.updated_at).getTime()};
}
async function fetchServerRecords(id){
  let q=sb.from('work_records').select('*,record_materials(*),record_approvals(*),record_photos(*)');
  q=id?q.eq('id',id).maybeSingle():q.order('work_date',{ascending:false}).order('created_at',{ascending:false});
  const {data,error}=await q;if(error)throw error;return id?(data?mapServer(data):null):(data||[]).map(mapServer);
}
async function uploadPhotos(v,userId){
  for(const [field,kind] of Object.entries(photoKinds)){
    const ph=v.photos?.[field]; if(!ph?.blob)continue;
    const safe=(ph.name||'photo.jpg').replace(/[^a-zA-Z0-9._-]/g,'_');
    const path=`${v.id}/${kind}-${Date.now()}-${safe}`;
    const {error:upErr}=await sb.storage.from('road-team-photos').upload(path,ph.blob,{contentType:ph.type||'image/jpeg',upsert:false});if(upErr)throw upErr;
    const {error:metaErr}=await sb.from('record_photos').upsert({record_id:v.id,kind,storage_path:path,file_name:ph.name||safe,mime_type:ph.type||'',size_bytes:ph.size||0,uploaded_by:userId},{onConflict:'record_id,kind'});if(metaErr)throw metaErr;
  }
}
async function serverPut(v){
  const {data:{user}}=await sb.auth.getUser();if(!user)return localPutRecord(v);
  const row={id:v.id,record_no:v.recordNo||null,work_date:v.date||new Date().toISOString().slice(0,10),start_time:v.startTime||null,end_time:v.endTime||null,location:v.location||'',work_type:v.type||null,paint_type:v.paintType||null,color:v.color||null,length_m:Number(v.length||0),width_cm:Number(v.width||0),area_m2:Number(v.area||0),latitude:v.lat?Number(v.lat):null,longitude:v.lng?Number(v.lng):null,staff:v.staff||null,equipment:v.equipment||null,note:v.note||null,status:v.status||'draft',created_by:user.id};
  const {error}=await sb.from('work_records').upsert(row,{onConflict:'id'});if(error)throw error;
  const {error:delMat}=await sb.from('record_materials').delete().eq('record_id',v.id);if(delMat)throw delMat;
  if(v.materials?.length){const {error:matErr}=await sb.from('record_materials').insert(v.materials.map(m=>({record_id:v.id,name:m.name,quantity:Number(m.quantity||0),unit:m.unit||null})));if(matErr)throw matErr;}
  const {data:existing,error:apErr}=await sb.from('record_approvals').select('id').eq('record_id',v.id);if(apErr)throw apErr;
  const existingCount=(existing||[]).length, extras=(v.approvals||[]).slice(existingCount);
  for(const a of extras){const {error:e}=await sb.from('record_approvals').insert({record_id:v.id,role:a.role,action:a.action,comment:a.comment||null,approved_by:user.id});if(e)throw e;}
  await uploadPhotos(v,user.id); return v;
}
async function serverDelete(id){
  const {data:{user}}=await sb.auth.getUser();if(!user)return localDeleteRecord(id);
  const {data:photos}=await sb.from('record_photos').select('storage_path').eq('record_id',id);const paths=(photos||[]).map(x=>x.storage_path).filter(Boolean);if(paths.length)await sb.storage.from('road-team-photos').remove(paths);
  const {error}=await sb.from('work_records').delete().eq('id',id);if(error)throw error;
}

allRecords=async()=>serverSession?fetchServerRecords():localAllRecords();
getRecord=async id=>serverSession?fetchServerRecords(id):localGetRecord(id);
putRecord=async v=>serverSession?serverPut(v):localPutRecord(v);
deleteRecord=async id=>serverSession?serverDelete(id):localDeleteRecord(id);

async function uploadLocalRecords(){
  if(!serverSession)return alert('سەرەتا بچۆ ژوورەوە');
  const records=await localAllRecords(); if(!records.length)return alert('تۆماری کۆنی ناوخۆ نییە');
  if(!confirm(`${records.length} تۆمار بۆ سێرڤەر بنێردرێت؟`))return;
  let ok=0;for(const r of records){try{await serverPut(r);ok++;}catch(e){console.error(e);}}
  await refresh();alert(`${ok} تۆمار بۆ سێرڤەر نێردرا`);
}
async function autoUploadMissingLocalRecords(){
  if(!serverSession)return;
  try{
    const local=await localAllRecords();
    if(!local.length)return;
    const {data,error}=await sb.from('work_records').select('id');
    if(error)throw error;
    const serverIds=new Set((data||[]).map(r=>r.id));
    let pushed=0;
    for(const r of local){if(serverIds.has(r.id))continue;try{await serverPut(r);pushed++;}catch(e){console.error('auto sync record failed',e);}}
    if(pushed)console.log(`Auto-synced ${pushed} local records to server`);
  }catch(e){console.error('Auto sync failed',e);}
}

injectServerUi();
updateSessionUi().then(async()=>{if(serverSession)await autoUploadMissingLocalRecords();await refresh();});
sb.auth.onAuthStateChange((_event,session)=>{serverSession=session;updateSessionUi();setTimeout(async()=>{if(session)await autoUploadMissingLocalRecords();await refresh();},0);});
window.teamPaintServer={client:sb,get session(){return serverSession;}};
})();