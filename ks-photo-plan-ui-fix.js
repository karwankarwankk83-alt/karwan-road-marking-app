/* KS Survey CAD UI Fix — full image workspace + visible point tool */
(()=>{
  const $=s=>document.querySelector(s);

  function enhanceImage(){
    const im=$('#ksSurveyImage');
    if(im && !window.KS_SURVEY?.rectified){
      im.setAttribute('preserveAspectRatio','xMidYMid meet');
      im.setAttribute('x','0');im.setAttribute('y','0');im.setAttribute('width','1000');im.setAttribute('height','650');
    }
  }

  function addPointToolbar(){
    const canvas=$('.ks-sk-canvas');
    const svg=$('#ksSketchSvg');
    if(!canvas||!svg||$('#ksPointToolbar'))return;
    canvas.classList.add('ks-full-photo-workspace');
    const bar=document.createElement('div');
    bar.id='ksPointToolbar';
    bar.className='ks-point-toolbar';
    bar.innerHTML=`<button id="ksPointPick" class="primary">🎯 دیاریکردنی ٤ خاڵ</button><button id="ksPointEdit">✥ دەستکاری خاڵ</button><button id="ksPointDone">✓ کۆتایی</button><span id="ksPointHint">تا «دیاریکردنی ٤ خاڵ» نەدەیت، هیچ خاڵێک دانانرێت.</span>`;
    canvas.insertBefore(bar,svg);
    $('#ksPointPick').onclick=()=>{$('#kppCal')?.click();bar.classList.add('active');$('#ksPointHint').textContent='ئێستا لەسەر خودی وێنە خاڵی ١، ٢، ٣، ٤ تاچ بکە.'};
    $('#ksPointEdit').onclick=()=>{$('#kppEdit')?.click();bar.classList.add('active');$('#ksPointHint').textContent='خاڵێک هەڵبژێرە، پاشان شوێنی نوێی تاچ بکە.'};
    $('#ksPointDone').onclick=()=>{document.querySelector('#kppHitLayer')?.remove();bar.classList.remove('active');$('#ksPointHint').textContent='کۆتایی. دەتوانیت دووبارە ئامرازی خاڵ چالاک بکەیت.'};
  }

  function keepEnhanced(){
    enhanceImage();
    addPointToolbar();
  }

  const old=window.ksSketchbookView;
  if(typeof old==='function'){
    window.ksSketchbookView=function(){old();setTimeout(keepEnhanced,80)};
    window.markingDesignerView=window.ksSketchbookView;
  }

  const mo=new MutationObserver(()=>setTimeout(keepEnhanced,10));
  mo.observe(document.documentElement,{childList:true,subtree:true});

  const st=document.createElement('style');
  st.textContent=`
  .ks-full-photo-workspace{position:relative;height:min(72vh,760px)!important;min-height:460px!important;padding:6px!important;display:flex;flex-direction:column;overflow:hidden!important}
  .ks-full-photo-workspace #ksSketchSvg{width:100%!important;height:100%!important;min-height:0!important;flex:1 1 auto;display:block;touch-action:none;background:#111;border-radius:12px}
  .ks-point-toolbar{position:absolute;z-index:40;left:10px;right:10px;top:10px;display:flex;align-items:center;gap:6px;overflow:auto;padding:7px;background:rgba(7,10,10,.88);backdrop-filter:blur(6px);border:1px solid #394246;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.35)}
  .ks-point-toolbar button{white-space:nowrap;border:1px solid #4a5458;background:#171b1d;color:#eee;border-radius:9px;padding:9px 10px;font-weight:900;font-size:11px}
  .ks-point-toolbar .primary{border-color:#ffd43b;color:#111;background:#ffd43b}
  .ks-point-toolbar.active{outline:2px solid rgba(255,212,59,.75)}
  .ks-point-toolbar span{white-space:nowrap;color:#c9d2d5;font-size:10px;padding-inline:5px}
  #kppHitLayer{cursor:crosshair!important}
  @media(max-width:600px){.ks-full-photo-workspace{height:68vh!important;min-height:420px!important}.ks-point-toolbar{top:7px;left:7px;right:7px}.ks-point-toolbar button{padding:8px;font-size:10px}}
  `;
  document.head.appendChild(st);
})();