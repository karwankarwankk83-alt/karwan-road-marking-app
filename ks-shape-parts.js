/* KS geometric parts palette: arrowheads, arcs, circles, triangles, U-curves */
(()=>{
  let selected=null, parts=[];
  const $=s=>document.querySelector(s);
  function markup(p,i){
    const c='#ffffff', sw=5;
    if(p.type==='arrow') return `<g data-kspart="${i}" transform="translate(${p.x} ${p.y}) rotate(${p.r||0}) scale(${p.s||1})"><path d="M0 -42 L42 8 L16 8 L16 44 L-16 44 L-16 8 L-42 8 Z" fill="${c}"/></g>`;
    if(p.type==='arc') return `<g data-kspart="${i}" transform="translate(${p.x} ${p.y}) rotate(${p.r||0}) scale(${p.s||1})"><path d="M-55 40 Q0 -62 55 40" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/></g>`;
    if(p.type==='circle') return `<circle data-kspart="${i}" cx="${p.x}" cy="${p.y}" r="45" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    if(p.type==='triangle') return `<path data-kspart="${i}" d="M${p.x} ${p.y-48} L${p.x+48} ${p.y+38} L${p.x-48} ${p.y+38} Z" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    if(p.type==='uturn') return `<g data-kspart="${i}" transform="translate(${p.x} ${p.y}) scale(${p.s||1})"><path d="M34 58 V-4 C34-42 -34-42 -34-4 V18" fill="none" stroke="${c}" stroke-width="${sw+5}" stroke-linecap="round"/><path d="M-50 10 L-34 34 L-18 10 Z" fill="${c}"/></g>`;
    if(p.type==='chevron') return `<g data-kspart="${i}" transform="translate(${p.x} ${p.y}) scale(${p.s||1})"><path d="M-55 -35 L0 20 L55 -35" fill="none" stroke="${c}" stroke-width="${sw+4}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    return '';
  }
  function renderParts(){const g=$('#ksWorld');if(!g)return;g.querySelectorAll('[data-kspart]').forEach(n=>n.remove());g.insertAdjacentHTML('beforeend',parts.map(markup).join(''))}
  function worldPoint(e){const svg=$('#ksSketchSvg'),g=$('#ksWorld');if(!svg||!g)return null;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;try{return pt.matrixTransform(g.getScreenCTM().inverse())}catch{return null}}
  function place(e){if(!selected)return;const p=worldPoint(e);if(!p)return;parts.push({type:selected,x:+p.x.toFixed(1),y:+p.y.toFixed(1),s:1,r:0});renderParts();selected=null;sync();e.preventDefault();e.stopPropagation()}
  function sync(){document.querySelectorAll('[data-kspart-btn]').forEach(b=>b.classList.toggle('on',b.dataset.kspartBtn===selected));const hint=$('#ksPartHint');if(hint)hint.textContent=selected?'ئێستا لەسەر پەڕەکە کلیک بکە بۆ دانانی پارچەکە':'پارچەیەک هەڵبژێرە'}
  function enhance(){
    const tools=$('.ks-sk-tools'),svg=$('#ksSketchSvg');if(!tools||!svg||$('#ksParts'))return;
    const box=document.createElement('section');box.id='ksParts';box.className='ks-parts';box.innerHTML=`<b>پارچە هەندەسییەکان</b><div><button data-kspart-btn="arrow">➤ سەری تیر</button><button data-kspart-btn="arc">⌒ قەوس</button><button data-kspart-btn="uturn">↶ U قەوس</button><button data-kspart-btn="chevron">⌄ Chevron</button><button data-kspart-btn="circle">○ بازنە</button><button data-kspart-btn="triangle">△ سێگۆشە</button></div><small id="ksPartHint">پارچەیەک هەڵبژێرە</small>`;
    tools.insertAdjacentElement('afterend',box);
    box.querySelectorAll('[data-kspart-btn]').forEach(b=>b.onclick=()=>{selected=selected===b.dataset.kspartBtn?null:b.dataset.kspartBtn;sync()});
    svg.addEventListener('pointerdown',place,true);
    const obs=new MutationObserver(()=>renderParts());obs.observe(svg,{childList:true,subtree:true});renderParts();
  }
  const old=window.ksSketchbookView;if(typeof old==='function')window.ksSketchbookView=function(){old();setTimeout(enhance,0)};
  window.markingDesignerView=window.ksSketchbookView;
  const st=document.createElement('style');st.textContent=`.ks-parts{background:#101212;border:1px solid var(--line);border-radius:18px;padding:10px;margin-bottom:10px}.ks-parts>b{display:block;font-size:13px;margin-bottom:7px}.ks-parts>div{display:flex;gap:7px;overflow:auto}.ks-parts button{white-space:nowrap;border:1px solid #3a3e3e;background:#191c1c;color:#eee;border-radius:11px;padding:9px 10px;font-weight:800}.ks-parts button.on{border-color:var(--yellow);color:var(--yellow);background:#282307}.ks-parts small{display:block;color:var(--muted);font-size:10px;margin-top:7px}body.ks-draw-full .ks-parts{display:none!important}`;document.head.appendChild(st);
})();