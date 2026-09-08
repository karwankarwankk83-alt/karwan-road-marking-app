(()=>{
const ADMIN_EMAIL='karwankarwankk83@gmail.com';
let checking=false;
let linkedAdmin=false;
let linkedEmail=ADMIN_EMAIL;

async function waitReady(){
  for(let i=0;i<120;i++){
    if(window.teamPaintDevice?.api&&window.teamPaintServer?.client&&document.querySelector('#serverModal'))return true;
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}

function localDeviceEmail(){
  return String(window.teamPaintDevice?.email||localStorage.getItem('team-paint-device-email')||'').trim().toLowerCase();
}

function enterAdminMode(){
  linkedAdmin=false;
  const root=document.documentElement;
  root.classList.remove('member-mode','admin-login-required');
  root.classList.add('admin-mode');
  document.querySelector('#memberView')?.classList.add('hidden');
  document.querySelector('#serverModal')?.classList.add('hidden');
  window.teamPaintLinkedAdminDevice=true;
  window.teamPaintAccess={role:'admin'};
}

function showAdminLogin(email=ADMIN_EMAIL){
  linkedAdmin=true;
  linkedEmail=String(email||ADMIN_EMAIL).trim().toLowerCase()||ADMIN_EMAIL;
  window.teamPaintLinkedAdminDevice=true;
  window.teamPaintAccess={role:'admin-login-required'};

  const root=document.documentElement;
  root.classList.remove('member-mode','admin-mode');
  root.classList.add('admin-login-required');
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
  if(emailInput)emailInput.value=linkedEmail;
  const help=document.querySelector('#serverHelp');
  if(help)help.textContent='🔐 ئەم ئامێرە وەک Admin ناسراوە. وشەی نهێنی Admin بنووسە و «چوونەژوورەوە» دابگرە.';
  modal.classList.remove('hidden');
}

async function checkLinkedAdmin(){
  if(checking)return false;
  checking=true;
  try{
    if(!await waitReady())return false;
    const sb=window.teamPaintServer.client;
    const {data:{user}}=await sb.auth.getUser();

    if(user){
      const {data:p}=await sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
      if(p?.role==='admin'){
        enterAdminMode();
        return true;
      }
    }

    let st=null;
    try{ st=await window.teamPaintDevice.api('status'); }
    catch(e){ console.warn('admin device status',e); }

    const serverLinked=st?.approval_status==='approved'&&st?.is_enabled&&st?.linked_role==='admin';
    const reservedAdminEmail=window.teamPaintDevice?.registered===true&&localDeviceEmail()===ADMIN_EMAIL;

    if(serverLinked||reservedAdminEmail){
      if(user){
        try{await sb.auth.signOut();}catch(e){console.warn('admin device signout',e);}
      }
      showAdminLogin(st?.linked_email||localDeviceEmail()||ADMIN_EMAIL);
      return true;
    }
  }catch(e){
    console.warn('admin device bootstrap',e);
  }finally{
    checking=false;
  }
  return false;
}

(async()=>{
  await checkLinkedAdmin();

  window.addEventListener('team-paint-device-ready',checkLinkedAdmin);
  window.addEventListener('focus',checkLinkedAdmin);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkLinkedAdmin();});

  if(window.teamPaintServer?.client){
    window.teamPaintServer.client.auth.onAuthStateChange(()=>setTimeout(checkLinkedAdmin,0));
  }

  setInterval(()=>{
    if(linkedAdmin){
      document.documentElement.classList.remove('member-mode');
      document.querySelector('#memberView')?.classList.add('hidden');
      showAdminLogin(linkedEmail);
    }else{
      checkLinkedAdmin();
    }
  },1000);
})();
})();