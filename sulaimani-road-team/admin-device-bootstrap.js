(()=>{
async function waitReady(){
  for(let i=0;i<80;i++){
    if(window.teamPaintDevice?.api&&window.teamPaintServer?.client&&document.querySelector('#serverModal'))return true;
    await new Promise(r=>setTimeout(r,125));
  }
  return false;
}
function showAdminLogin(email){
  document.documentElement.classList.remove('member-mode');
  document.querySelector('#memberView')?.classList.add('hidden');
  const modal=document.querySelector('#serverModal');
  if(!modal)return;
  const signup=document.querySelector('#serverSignup');
  const upload=document.querySelector('#serverUploadLocal');
  const logout=document.querySelector('#serverLogout');
  const name=document.querySelector('#serverName');
  const emailInput=document.querySelector('#serverEmail');
  if(signup)signup.style.display='none';
  if(upload)upload.style.display='none';
  if(logout)logout.style.display='none';
  if(name?.closest('label'))name.closest('label').style.display='none';
  if(emailInput&&!emailInput.value)emailInput.value=email||'';
  const help=document.querySelector('#serverHelp');
  if(help)help.textContent='🔐 ئەم ئامێرە بە هەژماری Admin بەستراوەتەوە. تەنها یەک جار وشەی نهێنی Admin بنووسە بۆ چالاککردنی دەسەڵاتی Admin لەم ئامێرە.';
  modal.classList.remove('hidden');
}
(async()=>{
  if(!await waitReady())return;
  try{
    const sb=window.teamPaintServer.client;
    const {data:{user}}=await sb.auth.getUser();
    if(user)return;
    if(!window.teamPaintDevice.registered)return;
    const st=await window.teamPaintDevice.api('status');
    if(st?.approval_status==='approved'&&st?.is_enabled&&st?.linked_role==='admin'){
      window.teamPaintLinkedAdminDevice=true;
      showAdminLogin(st.linked_email||localStorage.getItem('team-paint-device-email')||'');
      setTimeout(()=>showAdminLogin(st.linked_email||''),800);
    }
  }catch(e){console.warn('admin device bootstrap',e);}
})();
})();