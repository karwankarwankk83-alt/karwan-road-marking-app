(()=>{
  const history=[];
  let voiceEnabled=localStorage.getItem('ksVoiceEnabled')!=='false';
  const greeting='سَلاو كاروان. چون يارماتيت بِدَم؟';
  const css=`
  .ks-ai-btn{position:fixed;right:18px;bottom:84px;z-index:90;width:58px;height:58px;border-radius:50%;border:2px solid #806600;background:#f4c400;color:#111;font-size:25px;box-shadow:0 12px 35px #0009;cursor:pointer}
  .ks-ai-panel{position:fixed;z-index:100;right:12px;bottom:78px;width:min(390px,calc(100vw - 24px));height:min(620px,calc(100dvh - 110px));display:none;flex-direction:column;background:#0d0f0e;border:1px solid #5d5015;border-radius:24px;overflow:hidden;box-shadow:0 24px 80px #000c;color:#f5f5f5;direction:rtl}
  .ks-ai-panel.open{display:flex}.ks-ai-head{display:flex;align-items:center;gap:10px;padding:14px;background:linear-gradient(135deg,#1a1b14,#0d0f0e);border-bottom:1px solid #373317}.ks-ai-avatar{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:#f4c400;color:#111;font-size:21px}.ks-ai-title{flex:1}.ks-ai-title b{display:block}.ks-ai-title small{color:#8fe3a7;font-size:10px}.ks-ai-close,.ks-ai-voice{border:0;background:#252724;color:#fff;width:36px;height:36px;border-radius:11px;font-size:18px;cursor:pointer}.ks-ai-voice.off{opacity:.45}.ks-ai-msgs{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.ks-ai-msg{max-width:86%;padding:10px 12px;border-radius:16px;line-height:1.8;font-size:13px;white-space:pre-wrap}.ks-ai-msg.bot{align-self:flex-start;background:#20231f;border:1px solid #343833}.ks-ai-msg.user{align-self:flex-end;background:#f4c400;color:#111}.ks-ai-compose{display:grid;grid-template-columns:1fr 48px;gap:8px;padding:11px;border-top:1px solid #292c29;background:#111311}.ks-ai-input{min-width:0;border:1px solid #353936;background:#191b1a;color:#fff;border-radius:15px;padding:12px;font:inherit;outline:none}.ks-ai-send{border:0;border-radius:15px;background:#f4c400;color:#111;font-size:20px;font-weight:900}.ks-ai-note{text-align:center;color:#858b87;font-size:9px;padding:0 10px 8px}
  body.light .ks-ai-panel{background:#fff;color:#171717}body.light .ks-ai-msg.bot{background:#f2f3ef}body.light .ks-ai-input{background:#fff;color:#111}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  const btn=document.createElement('button');btn.className='ks-ai-btn';btn.type='button';btn.title='یاریدەدەری کوردی';btn.textContent='🤖';
  const panel=document.createElement('section');panel.className='ks-ai-panel';panel.innerHTML=`<div class="ks-ai-head"><div class="ks-ai-avatar">KS</div><div class="ks-ai-title"><b>یاریدەدەری KS</b><small>● ئامادەی یارمەتیدانم</small></div><button class="ks-ai-voice" type="button" aria-label="دەنگ">🔊</button><button class="ks-ai-close" type="button" aria-label="داخستن">×</button></div><div class="ks-ai-msgs"></div><form class="ks-ai-compose"><input class="ks-ai-input" autocomplete="off" placeholder="بە کوردی پرسیار بکە…"><button class="ks-ai-send" type="submit">➤</button></form><div class="ks-ai-note">یاریدەدەری AI ـی KS Road Marking</div>`;
  document.body.append(btn,panel);
  const msgs=panel.querySelector('.ks-ai-msgs'),input=panel.querySelector('.ks-ai-input'),form=panel.querySelector('form'),voiceBtn=panel.querySelector('.ks-ai-voice');
  voiceBtn.classList.toggle('off',!voiceEnabled);
  function add(role,text){const el=document.createElement('div');el.className='ks-ai-msg '+(role==='user'?'user':'bot');el.textContent=text;msgs.appendChild(el);msgs.scrollTop=msgs.scrollHeight;return el}
  function chooseVoice(){
    const voices=speechSynthesis.getVoices();
    return voices.find(v=>/^ku/i.test(v.lang))||voices.find(v=>/^ckb/i.test(v.lang))||voices.find(v=>/^ar-IQ/i.test(v.lang))||voices.find(v=>/^ar/i.test(v.lang))||voices[0];
  }
  function speak(text){
    if(!voiceEnabled||!('speechSynthesis' in window))return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(String(text).replace(/[👋🤖●]/g,''));
    const v=chooseVoice();if(v){u.voice=v;u.lang=v.lang}else{u.lang='ar-IQ'}u.rate=.72;u.pitch=.95;
    speechSynthesis.speak(u);
  }
  add('assistant','سڵاو کاروان 👋\nمن یاریدەدەری کوردی KS ـم. دەتوانیت لەبارەی هێڵکێشانی شەقام، بۆیاخ، پێوانە، خەمڵاندنی مادە و بەشەکانی ئەپ پرسیارم لێ بکەیت.');
  let greeted=false;
  function open(){panel.classList.add('open');btn.style.display='none';if(!greeted){greeted=true;speak(greeting)}setTimeout(()=>input.focus(),100)}
  function close(){panel.classList.remove('open');btn.style.display='';if('speechSynthesis' in window)speechSynthesis.cancel()}
  btn.addEventListener('click',open);panel.querySelector('.ks-ai-close').addEventListener('click',close);
  voiceBtn.addEventListener('click',()=>{voiceEnabled=!voiceEnabled;localStorage.setItem('ksVoiceEnabled',String(voiceEnabled));voiceBtn.classList.toggle('off',!voiceEnabled);voiceBtn.textContent=voiceEnabled?'🔊':'🔇';if(voiceEnabled)speak('دەنگ چالاک کرا');else if('speechSynthesis' in window)speechSynthesis.cancel()});
  form.addEventListener('submit',async e=>{e.preventDefault();const text=input.value.trim();if(!text)return;input.value='';add('user',text);history.push({role:'user',content:text});const wait=add('assistant','بیر دەکەمەوە…');input.disabled=true;
    try{const r=await fetch('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:history.slice(-12)})});const data=await r.json();if(!r.ok)throw new Error(data.error||'AI unavailable');wait.textContent=data.text||'وەڵامێک نەگەڕایەوە.';history.push({role:'assistant',content:wait.textContent});speak(wait.textContent)}
    catch(err){const offline='ببورە کاروان، بەشی زیرەکی دەستکرد تا دانانی کرێدیتی API ناچالاکە. دەنگ و سڵاوکردنی کوردی بەردەوام کار دەکەن.';wait.textContent=offline;speak(offline);console.error(err)}finally{input.disabled=false;input.focus();msgs.scrollTop=msgs.scrollHeight}
  });
})();