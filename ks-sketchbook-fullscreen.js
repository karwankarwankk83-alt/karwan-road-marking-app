/* KS Sketchbook fullscreen compact mode */
(()=>{
  const oldView=window.ksSketchbookView;
  if(typeof oldView!=='function') return;
  let full=false;
  function leave(){
    full=false;
    document.body.classList.remove('ks-draw-full');
    document.querySelector('#ksFullBtn')?.setAttribute('aria-pressed','false');
    const b=document.querySelector('#ksFullBtn'); if(b) b.innerHTML='⛶ <span>تەواوی شاشە</span>';
    try{ if(document.fullscreenElement) document.exitFullscreen?.(); }catch(e){}
  }
  function enter(){
    full=true;
    document.body.classList.add('ks-draw-full');
    document.querySelector('#ksFullBtn')?.setAttribute('aria-pressed','true');
    const b=document.querySelector('#ksFullBtn'); if(b) b.innerHTML='✕ <span>بچووک بکە</span>';
    try{ document.querySelector('.ks-sk-canvas')?.requestFullscreen?.().catch(()=>{}); }catch(e){}
  }
  function toggle(){ full?leave():enter(); }
  function enhance(){
    const canvas=document.querySelector('.ks-sk-canvas');
    if(!canvas || document.querySelector('#ksFullBtn')) return;
    const btn=document.createElement('button');
    btn.id='ksFullBtn'; btn.className='ks-full-btn'; btn.type='button';
    btn.innerHTML='⛶ <span>تەواوی شاشە</span>';
    btn.onclick=toggle;
    const zoom=document.querySelector('.ks-zoom');
    (zoom||canvas).insertAdjacentElement(zoom?'afterbegin':'beforebegin',btn);
    const mini=document.createElement('div');
    mini.className='ks-full-mini';
    mini.innerHTML='<button type="button" data-full-tool="pen" title="کێشان">✎</button><button type="button" data-full-tool="line" title="هێڵ">╱</button><button type="button" data-full-tool="rect" title="چوارگۆشە">▭</button><button type="button" data-full-tool="pan" title="جوڵاندن">✋</button><button type="button" id="ksFullZoomOut">−</button><b id="ksFullZoomText">100%</b><button type="button" id="ksFullZoomIn">＋</button><button type="button" id="ksFullExit">✕</button>';
    canvas.appendChild(mini);
    mini.querySelectorAll('[data-full-tool]').forEach(x=>x.onclick=()=>document.querySelector(`[data-sktool="${x.dataset.fullTool}"]`)?.click());
    mini.querySelector('#ksFullZoomOut').onclick=()=>document.querySelector('#ksZoomOut')?.click();
    mini.querySelector('#ksFullZoomIn').onclick=()=>document.querySelector('#ksZoomIn')?.click();
    mini.querySelector('#ksFullExit').onclick=leave;
    const obs=new MutationObserver(()=>{const a=document.querySelector('#ksZoomLabel'),b=document.querySelector('#ksFullZoomText');if(a&&b)b.textContent=a.textContent});
    const z=document.querySelector('#ksZoomLabel'); if(z) obs.observe(z,{childList:true,subtree:true,characterData:true});
  }
  window.ksSketchbookView=function(){ leave(); oldView(); setTimeout(enhance,0); };
  window.markingDesignerView=window.ksSketchbookView;
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&full)leave()});
  const st=document.createElement('style');
  st.textContent=`
  .ks-full-btn{border:1px solid #5b531e!important;background:#2a2507!important;color:#ffd43b!important;border-radius:10px!important;padding:9px 12px!important;font-weight:900!important;white-space:nowrap}
  .ks-full-mini{display:none}
  body.ks-draw-full{overflow:hidden!important;background:#111!important}
  body.ks-draw-full .topbar,body.ks-draw-full .bottom-nav,body.ks-draw-full .ks-sk-head,body.ks-draw-full .ks-paper,body.ks-draw-full .ks-sk-controls,body.ks-draw-full .ks-sk-tools,body.ks-draw-full .ks-zoom,body.ks-draw-full .ks-sk-bottom,body.ks-draw-full .ks-sk-tip{display:none!important}
  body.ks-draw-full #view{position:fixed!important;inset:0!important;z-index:99990!important;padding:0!important;margin:0!important;max-width:none!important;width:100vw!important;height:100dvh!important;background:#111!important}
  body.ks-draw-full .ks-sk-canvas{position:absolute!important;inset:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;width:100vw!important;height:100dvh!important;background:#151818!important}
  body.ks-draw-full .ks-sk-canvas svg{width:100vw!important;height:100dvh!important;min-height:0!important;border-radius:0!important;display:block!important}
  body.ks-draw-full .ks-full-mini{display:flex!important;position:absolute;z-index:12;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));gap:5px;align-items:center;background:rgba(8,10,10,.88);border:1px solid #4b4f4f;border-radius:16px;padding:6px;box-shadow:0 5px 24px rgba(0,0,0,.45);direction:ltr;max-width:calc(100vw - 18px);overflow:auto}
  .ks-full-mini button{min-width:38px;height:38px;border:1px solid #444;background:#202323;color:#fff;border-radius:10px;font-size:18px;font-weight:900}.ks-full-mini b{min-width:48px;text-align:center;color:#ffd43b;font:800 12px Arial}
  @media(max-width:600px){.ks-full-btn span{display:none}.ks-full-btn{min-width:42px;padding:9px!important}.ks-full-mini button{min-width:36px;height:36px}}
  `;
  document.head.appendChild(st);
})();