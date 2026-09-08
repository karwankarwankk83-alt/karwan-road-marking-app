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
  document.documentElement.classList.add('admin-login-required');
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
  if(help)help.textContent='🔐 ئەم ئامێرە بە هەژماری Admin بەستراوەتەوە. وشەی نهێنی Admin بنووسە و «چوونەژوورەوە» دابگرە.';
  modal.classList.remove('hidden');
}
let checking=false,done=false;
async function checkLinkedAdmin(){
  if(done||checking)return false;
  checking=true;
  try{
    if(!await waitReady())return false;
    const sb=window.teamPaintServer.client;
    const {data:{user}}=await sb.auth.getUser();
    if(user){
      const {data:p}=await sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
      if(p?.role==='admin'){
        done=true;
        document.documentElement.classList.remove('member-mode','admin-login-required');
        document.documentElement.classList.add('admin-mode');
        document.querySelector('#memberView')?.classList.add('hidden');
        window.teamPaintAccess={role:'admin'};
        return true;
      }
      return false;
    }
    if(!window.teamPaintDevice.registered)return false;
    const st=await window.teamPaintDevice.api('status');
    if(st?.approval_status==='approved'&&st?.is_enabled&&st?.linked_role==='admin'){
      done=true;
      window.teamPaintLinkedAdminDevice=true;
      window.teamPaintAccess={role:'admin-login-required'};
      showAdminLogin(st.linked_email||localStorage.getItem('team-paint-device-email')||'');
      setTimeout(()=>showAdminLogin(st.linked_email||''),500);
      return true;
    }
  }catch(e){console.warn('admin device bootstrap',e);}finally{checking=false;}
  return false;
}
(async()=>{
  await checkLinkedAdmin();
  window.addEventListener('team-paint-device-ready',()=>{done=false;checkLinkedAdmin();});
  let tries=0;
  const timer=setInterval(async()=>{
    if(done||tries++>20){clearInterval(timer);return;}
    await checkLinkedAdmin();
  },500);
})();
})();