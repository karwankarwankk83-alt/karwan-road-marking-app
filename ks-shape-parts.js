/* KS geometric parts palette + AutoCAD-like edit controls */
(()=>{
  let selectedType=null, parts=[], active=-1, drag=null, snap=true, ortho=false;
  const $=s=>document.querySelector(s);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const snapv=v=>snap?Math.round(v/10)*10:v;
  function markup(p,i){
    const c=i===active?'#ffd43b':'#ffffff', sw=i===active?6:5, tf=`translate(${p.x} ${p.y}) rotate(${p.r||0}) scale(${p.s||1})`;
    let body='';
    if(p.type==='arrow') body=`<path d="M0 -42 L42 8 L16 8 L16 44 L-16 44 L-16 8 L-42 8 Z" fill="${c}"/>`;
    else if(p.type==='arc') body=`<path d="M-55 40 Q0 -62 55 40" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
    else if(p.type==='circle') body=`<circle cx="0" cy="0" r="45" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    else if(p.type==='triangle') body=`<path d="M0 -48 L48 38 L-48 38 Z" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    else if(p.type==='uturn') body=`<path d="M34 58 V-4 C34-42 -34-42 -34-4 V18" fill="none" stroke="${c}" stroke-width="${sw+5}" stroke-linecap="round"/><path d="M-50 10 L-34 34 L-18 10 Z" fill="${c}"/>`;
    else if(p.type==='chevron') body=`<path d="M-55 -35 L0 20 L55 -35" fill="none" stroke="${c}" stroke-width="${sw+4}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const grips=i===active?`<g class="ks-grips"><rect x="-66" y="-66" width="132" height="132" fill="none" stroke="#58d68d" stroke-width="2" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/><circle data-grip="move" cx="0" cy="0" r="7" fill="#58d68d" vector-effect="non-scaling-stroke"/><rect data-grip="scale" x="59" y="59" width="14" height="14" fill="#58d68d" stroke="#0b0" vector-effect="non-scaling-stroke"/><circle data-grip="rotate" cx="0" cy="-88" r="8" fill="#ffd43b" stroke="#111" vector-effect="non-scaling-stroke"/><line x1="0" y1="-66" x2="0" y2="-80" stroke="#ffd43b" stroke-width="2" vector-effect="non-scaling-stroke"/></g>`:'';
    return `<g data-kspart="${i}" transform="${tf}" style="cursor:${i===active?'move':'pointer'}">${body}${grips}</g>`;
  }
  function renderParts(){const g=$('#ksWorld');if(!g)return;g.querySelectorAll('[data-kspart]').forEach(n=>n.remove());g.insertAdjacentHTML('beforeend',parts.map(markup).join(''));syncProps()}
  function worldPoint(e){const svg=$('#ksSketchSvg'),g=$('#ksWorld');if(!svg||!g)return null;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;try{return pt.matrixTransform(g.getScreenCTM().inverse())}catch{return null}}
  function chooseType(t){selectedType=selectedType===t?null:t;active=-1;syncPalette();renderParts()}
  function place(e){if(!selectedType)return false;const p=worldPoint(e);if(!p)return false;parts.push({type:selectedType,x:snapv(+p.x.toFixed(1)),y:snapv(+p.y.toFixed(1)),s:1,r:0});active=parts.length-1;selectedType=null;renderParts();syncPalette();e.preventDefault();e.stopPropagation();return true}
  function selectPart(e){const el=e.target.closest?.('[data-kspart]');if(!el)return false;active=+el.dataset.kspart;renderParts();e.preventDefault();e.stopPropagation();return true}
  function pointerDown(e){
    if(place(e))return;
    const partEl=e.target.closest?.('[data-kspart]');if(!partEl){if(active>=0){active=-1;renderParts()}return}
    active=+partEl.dataset.kspart;const p=parts[active],wp=worldPoint(e);if(!p||!wp)return;
    const grip=e.target.closest?.('[data-grip]')?.dataset.grip||'move';
    drag={mode:grip,start:wp,x:p.x,y:p.y,s:p.s||1,r:p.r||0,startDist:Math.hypot(wp.x-p.x,wp.y-p.y),startAng:Math.atan2(wp.y-p.y,wp.x-p.x)*180/Math.PI};
    renderParts();e.preventDefault();e.stopPropagation();
  }
  function pointerMove(e){if(!drag||active<0)return;const wp=worldPoint(e),p=parts[active];if(!wp||!p)return;
    if(drag.mode==='move'){
      let nx=drag.x+(wp.x-drag.start.x), ny=drag.y+(wp.y-drag.start.y);
      if(ortho){const dx=Math.abs(nx-drag.x),dy=Math.abs(ny-drag.y);if(dx>dy)ny=drag.y;else nx=drag.x}
      p.x=snapv(nx);p.y=snapv(ny);
    }else if(drag.mode==='scale'){
      const d=Math.hypot(wp.x-p.x,wp.y-p.y);p.s=clamp(d/(drag.startDist||1)*drag.s,.2,8);
    }else if(drag.mode==='rotate'){
      let a=Math.atan2(wp.y-p.y,wp.x-p.x)*180/Math.PI-drag.startAng+drag.r;
      if(ortho)a=Math.round(a/15)*15;p.r=((a%360)+360)%360;
    }
    renderParts();e.preventDefault();e.stopPropagation();
  }
  function pointerUp(){drag=null}
  function syncPalette(){document.querySelectorAll('[data-kspart-btn]').forEach(b=>b.classList.toggle('on',b.dataset.kspartBtn===selectedType));const h=$('#ksPartHint');if(h)h.textContent=selectedType?'لەسەر پەڕەکە کلیک بکە بۆ دانان':'پارچەیەک هەڵبژێرە یان پارچەیەکی دانراو کلیک بکە'}
  function syncProps(){const p=parts[active],box=$('#ksCadProps');if(!box)return;box.classList.toggle('show',!!p);if(!p)return;$('#ksPX').value=(p.x/10).toFixed(1);$('#ksPY').value=(p.y/10).toFixed(1);$('#ksPS').value=(p.s||1).toFixed(2);$('#ksPR').value=Math.round(p.r||0);$('#ksCadName').textContent=({arrow:'سەری تیر',arc:'قەوس',uturn:'U قەوس',chevron:'Chevron',circle:'بازنە',triangle:'سێگۆشە'})[p.type]||p.type}
  function applyProps(){if(active<0)return;const p=parts[active];p.x=(+$('#ksPX').value||0)*10;p.y=(+$('#ksPY').value||0)*10;p.s=clamp(+$('#ksPS').value||1,.2,8);p.r=((+$('#ksPR').value||0)%360+360)%360;renderParts()}
  function copyActive(){if(active<0)return;const p=parts[active];parts.push({...p,x:p.x+30,y:p.y+30});active=parts.length-1;renderParts()}
  function deleteActive(){if(active<0)return;parts.splice(active,1);active=-1;renderParts()}
  function enhance(){
    const tools=$('.ks-sk-tools'),svg=$('#ksSketchSvg');if(!tools||!svg||$('#ksParts'))return;
    const box=document.createElement('section');box.id='ksParts';box.className='ks-parts';box.innerHTML=`<div class="ks-cad-title"><b>پارچە هەندەسییەکان</b><span>CAD</span></div><div class="ks-parts-row"><button data-kspart-btn="arrow">➤ سەری تیر</button><button data-kspart-btn="arc">⌒ قەوس</button><button data-kspart-btn="uturn">↶ U قەوس</button><button data-kspart-btn="chevron">⌄ Chevron</button><button data-kspart-btn="circle">○ بازنە</button><button data-kspart-btn="triangle">△ سێگۆشە</button></div><div class="ks-cad-row"><button id="ksSnap" class="on">⌗ Snap</button><button id="ksOrtho">⊥ Ortho</button><button id="ksCopy">⧉ کۆپی</button><button id="ksDelete">⌫ سڕینەوە</button></div><small id="ksPartHint">پارچەیەک هەڵبژێرە یان پارچەیەکی دانراو کلیک بکە</small><div id="ksCadProps" class="ks-cad-props"><div class="ks-cad-props-head"><b id="ksCadName">پارچە</b><small>خاڵی سەوز = Move/Scale • خاڵی زەرد = Rotate</small></div><label>X (m)<input id="ksPX" type="number" step=".1"></label><label>Y (m)<input id="ksPY" type="number" step=".1"></label><label>Scale<input id="ksPS" type="number" step=".05" min=".2" max="8"></label><label>گۆشە °<input id="ksPR" type="number" step="1"></label><button id="ksApplyProps">جێبەجێکردن</button></div>`;
    tools.insertAdjacentElement('afterend',box);
    box.querySelectorAll('[data-kspart-btn]').forEach(b=>b.onclick=()=>chooseType(b.dataset.kspartBtn));
    $('#ksSnap').onclick=e=>{snap=!snap;e.currentTarget.classList.toggle('on',snap)};
    $('#ksOrtho').onclick=e=>{ortho=!ortho;e.currentTarget.classList.toggle('on',ortho)};
    $('#ksCopy').onclick=copyActive;$('#ksDelete').onclick=deleteActive;$('#ksApplyProps').onclick=applyProps;
    svg.addEventListener('pointerdown',pointerDown,true);svg.addEventListener('pointermove',pointerMove,true);svg.addEventListener('pointerup',pointerUp,true);svg.addEventListener('pointercancel',pointerUp,true);
    document.addEventListener('keydown',e=>{if(active<0)return;if(e.key==='Delete'||e.key==='Backspace'){deleteActive()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){e.preventDefault();copyActive()}else if(e.key==='Escape'){active=-1;selectedType=null;renderParts();syncPalette()}});
    const obs=new MutationObserver(()=>{if(!svg.querySelector('[data-kspart]'))renderParts()});obs.observe(svg,{childList:true,subtree:true});renderParts();
  }
  const old=window.ksSketchbookView;if(typeof old==='function')window.ksSketchbookView=function(){old();setTimeout(enhance,0)};
  window.markingDesignerView=window.ksSketchbookView;
  const st=document.createElement('style');st.textContent=`
  .ks-parts{background:#101212;border:1px solid var(--line);border-radius:18px;padding:10px;margin-bottom:10px}.ks-cad-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}.ks-cad-title span{font:800 10px Arial;color:#111;background:var(--yellow);padding:3px 7px;border-radius:999px}.ks-parts-row,.ks-cad-row{display:flex;gap:7px;overflow:auto;margin-top:6px}.ks-parts button,.ks-cad-row button{white-space:nowrap;border:1px solid #3a3e3e;background:#191c1c;color:#eee;border-radius:11px;padding:9px 10px;font-weight:800}.ks-parts button.on,.ks-cad-row button.on{border-color:var(--yellow);color:var(--yellow);background:#282307}.ks-parts>small{display:block;color:var(--muted);font-size:10px;margin-top:7px}.ks-cad-props{display:none;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:9px;padding-top:9px;border-top:1px solid #303434}.ks-cad-props.show{display:grid}.ks-cad-props-head{grid-column:1/-1;display:flex;justify-content:space-between;gap:8px;align-items:center}.ks-cad-props-head small{color:#58d68d;font-size:9px}.ks-cad-props label{font-size:10px;color:var(--muted)}.ks-cad-props input{width:100%;box-sizing:border-box;margin-top:4px;background:#080909;color:#fff;border:1px solid #404545;border-radius:8px;padding:7px;direction:ltr;text-align:center}.ks-cad-props>button{grid-column:1/-1;background:var(--yellow);color:#111;border-color:var(--yellow)}body.ks-draw-full .ks-parts{display:none!important}@media(max-width:600px){.ks-cad-props{grid-template-columns:1fr 1fr}.ks-cad-props-head{grid-column:1/-1}.ks-cad-props>button{grid-column:1/-1}}
  `;document.head.appendChild(st);
})();