(()=>{
const ready=()=>window.teamPaintServer?.client&&document.querySelector('#serverModal');
function kurdishAuthError(error){
  const m=String(error?.message||'').toLowerCase();
  if(m.includes('invalid login credentials'))return 'ئیمەیڵ یان وشەی نهێنی دروست نییە.';
  if(m.includes('email not confirmed'))return 'ئیمەیڵەکەت هێشتا پشتڕاست نەکراوەتەوە. دوگمەی «دووبارە ناردنی ئیمەیڵ» بەکاربهێنە.';
  if(m.includes('user already registered'))return 'ئەم ئیمەیڵە پێشتر هەژماری بۆ دروست کراوە. ئەگەر پشتڕاست نەکراوەتەوە، ئیمەیڵەکە دووبارە بنێرە.';
  if(m.includes('rate limit'))return 'ناردنی ئیمەیڵ زۆر جار داواکراوە. چەند خولەکێک چاوەڕێ بکە و دووبارە هەوڵ بدە.';
  return error?.message||'هەڵەیەک ڕوویدا.';
}
async function install(){
  if(!ready())return setTimeout(install,300);
  const sb=window.teamPaintServer.client;
  const modal=document.querySelector('#serverModal .modal-card');
  const signupBtn=document.querySelector('#serverSignup');
  const loginBtn=document.querySelector('#serverLogin');
  const uploadBtn=document.querySelector('#serverUploadLocal');
  if(!modal||!signupBtn||!loginBtn)return;
  if(!document.querySelector('#serverResend')){
    const b=document.createElement('button');
    b.id='serverResend'; b.type='button'; b.className='secondary full';
    b.style.marginTop='8px';
    b.textContent='📧 دووبارە ناردنی ئیمەیڵی پشتڕاستکردنەوە';
    modal.insertBefore(b,uploadBtn||null);
  }
  const redirectTo=location.origin+location.pathname;
  loginBtn.onclick=async()=>{
    const email=document.querySelector('#serverEmail').value.trim();
    const password=document.querySelector('#serverPassword').value;
    if(!email||!password)return alert('ئیمەیڵ و وشەی نهێنی بنووسە');
    const {error}=await sb.auth.signInWithPassword({email,password});
    if(error)return alert('هەڵە لە چوونەژوورەوە: '+kurdishAuthError(error));
    alert('بە سەرکەوتوویی پەیوەست بوویت بە سێرڤەر');
    location.reload();
  };
  signupBtn.onclick=async()=>{
    const full_name=document.querySelector('#serverName').value.trim();
    const email=document.querySelector('#serverEmail').value.trim();
    const password=document.querySelector('#serverPassword').value;
    if(!email||password.length<6)return alert('ئیمەیڵ و وشەی نهێنیی لانیکەم ٦ پیت/ژمارە بنووسە');
    const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name},emailRedirectTo:redirectTo}});
    if(error)return alert('هەڵە لە دروستکردنی هەژمار: '+kurdishAuthError(error));
    if(data.session){alert('هەژمارەکە دروست بوو و پەیوەست بوویت');location.reload();}
    else alert('هەژمارەکە دروستە. ئیمەیڵی پشتڕاستکردنەوە دەنێردرێت؛ Inbox و Spam/Junk بپشکنە.');
  };
  document.querySelector('#serverResend').onclick=async()=>{
    const email=document.querySelector('#serverEmail').value.trim();
    if(!email)return alert('سەرەتا ئیمەیڵەکەت بنووسە');
    const btn=document.querySelector('#serverResend');
    btn.disabled=true; btn.textContent='ناردن...';
    const {error}=await sb.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}});
    btn.disabled=false; btn.textContent='📧 دووبارە ناردنی ئیمەیڵی پشتڕاستکردنەوە';
    if(error)return alert('ئیمەیڵەکە نەنێردرا: '+kurdishAuthError(error));
    alert('ئیمەیڵی پشتڕاستکردنەوە دووبارە نێردرا. Inbox و Spam/Junk بپشکنە.');
  };
}
function installAutoArea(){
  const lengthInput=document.querySelector('[name="length"]');
  const widthInput=document.querySelector('[name="width"]');
  const areaInput=document.querySelector('[name="area"]');
  const form=document.querySelector('#workForm');
  const approvalBtn=document.querySelector('#submitApproval');
  if(!lengthInput||!widthInput||!areaInput)return;
  areaInput.readOnly=true;
  areaInput.placeholder='خۆکار';
  areaInput.title='ڕووبەر خۆکارانە لە درێژی × پانی هەژمار دەکرێت';
  const calculateArea=()=>{
    const lengthM=Number(lengthInput.value||0);
    const widthCm=Number(widthInput.value||0);
    const areaM2=lengthM*(widthCm/100);
    areaInput.value=Number.isFinite(areaM2)?areaM2.toFixed(2):'0.00';
  };
  lengthInput.addEventListener('input',calculateArea);
  widthInput.addEventListener('input',calculateArea);
  lengthInput.addEventListener('change',calculateArea);
  widthInput.addEventListener('change',calculateArea);
  form?.addEventListener('submit',calculateArea,true);
  approvalBtn?.addEventListener('click',calculateArea,true);
  calculateArea();
}
install();
installAutoArea();
})();