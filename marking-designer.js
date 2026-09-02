/* KS Field Marking Designer — Dubai DTCDM based */
(()=>{
const $=s=>document.querySelector(s);
const templates={
 stop:{name:'STOP / وەستان',kind:'text',text:'STOP',w:2.4,h:1.6,speedBased:true,note:'نووسینی سەر شەقام؛ بەرزی پیت بەپێی خێرایی دەگۆڕێت.'},
 giveway:{name:'GIVE WAY / ڕێگە بدە',kind:'giveway',w:2,h:3,stroke:.1,note:'هێمای سێگۆشەی ڕێگەدان.'},
 zebra:{name:'زێبرا',kind:'zebra',w:4,h:3,stripe:.5,note:'پانی هەر بەشی زێبرا لە DTCDM ـدا 50 cm ـە.'},
 disabled:{name:'شوێنی خاوەن پێداویستی تایبەت',kind:'disabled',w:1.5,h:2,note:'هێمای 623.4؛ قەبارەی فەرمی 1.50 × 2.00 m.'},
 straight:{name:'تیری ڕاستەوخۆ',kind:'arrow',dir:'up',w:1.3,h:5,speedBased:true,note:'614.1؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی کلک','2.95 m'],['درێژی سەری تیر','2.05 m'],['پانی گشتی','1.30 m'],['درێژی گشتی','5.00 m']]},
 right:{name:'تیری لای ڕاست',kind:'arrow',dir:'right',w:2.4,h:5,speedBased:true,note:'614.2؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی تا شوێنی سووڕانەوە','2.50 m'],['پانی گشتی','2.40 m'],['درێژی گشتی','5.00 m']]},
 left:{name:'تیری لای چەپ',kind:'arrow',dir:'left',w:2.4,h:5,speedBased:true,note:'614.3؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی تا شوێنی سووڕانەوە','2.50 m'],['پانی گشتی','2.40 m'],['درێژی گشتی','5.00 m']]},
 straightRight:{name:'تیری ڕاستەوخۆ + ڕاست',kind:'arrow',dir:'straightRight',w:2.4,h:5,speedBased:true,note:'DTCDM 614.4.'},
 straightLeft:{name:'تیری ڕاستەوخۆ + چەپ',kind:'arrow',dir:'straightLeft',w:2.4,h:5,speedBased:true,note:'DTCDM 614.5.'},
 leftRight:{name:'تیری چەپ + ڕاست',kind:'arrow',dir:'leftRight',w:2.5,h:5,speedBased:true,note:'DTCDM 614.6.'},
 uturn:{name:'تیری U-Turn',kind:'arrow',dir:'uturn',w:2.4,h:5,speedBased:true,note:'DTCDM 614.7.'},
 straightUturn:{name:'تیری ڕاستەوخۆ + U-Turn',kind:'arrow',dir:'straightUturn',w:2.5,h:5,speedBased:true,note:'DTCDM 614.8.'},
 laneEnd:{name:'تیری کۆتایی لاین',kind:'text',text:'↗',w:1.71,h:4.7,note:'DTCDM 656؛ 1.71 × 4.70 m.'},
 turnLane:{name:'دەستپێکی لاینی سووڕانەوە',kind:'text',text:'↰',w:2.47,h:5,note:'DTCDM 682/683؛ 2.47 × 5.00 m.'},
 bus:{name:'BUS / پاس',kind:'text',text:'BUS',w:1.6,h:2.8,note:'DTCDM 6.5.1؛ 1.60 × 2.80 m.'},
 only:{name:'ONLY / تەنیا',kind:'text',text:'ONLY',w:2.1,h:2.8,note:'DTCDM 6.5.3؛ 2.10 × 2.80 m.'},
 taxi:{name:'TAXI / تەکسی',kind:'text',text:'TAXI',w:1.65,h:2.8,note:'DTCDM 6.5.7؛ 1.65 × 2.80 m.'},
 parking:{name:'P / پارکینگ',kind:'text',text:'P',w:2,h:2,note:'هێمای پارکینگ؛ پێوانەی پڕۆژە پشتڕاست بکەرەوە.'},
 pedestrian:{name:'ڕێڕەوی پیادە',kind:'text',text:'🚶',w:.52,h:1,note:'DTCDM 623.5؛ 52 cm × 1.00 m.'},
 railway:{name:'پێش ئاگادارکردنەوەی شەمەندەفەر',kind:'text',text:'✕',w:3,h:6,note:'DTCDM 659؛ بۆ ناوشار درێژی 6.00 m.'},
 speedHump:{name:'هێمای کۆسپ',kind:'text',text:'▲ ▲ ▲',w:1.5,h:1,note:'DTCDM 651؛ 3 سێگۆشە بۆ هەر لاینێک.'},
 yellowBox:{name:'Yellow Box / چوارگۆشەی زەرد',kind:'text',text:'╳',w:4,h:4,note:'DTCDM 622؛ پێوانە بەپێی شێوەی چوارڕێیان.'},
 hov:{name:'HOV / لاینی ئۆتۆمبێلی هاوبەش',kind:'text',text:'◇',w:2,h:5,note:'DTCDM 623.2.'},
 speed30:{name:'ژمارەی خێرایی 30',kind:'text',text:'30',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed40:{name:'ژمارەی خێرایی 40',kind:'text',text:'40',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed50:{name:'ژمارەی خێرایی 50',kind:'text',text:'50',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed60:{name:'ژمارەی خێرایی 60',kind:'text',text:'60',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed70:{name:'ژمارەی خێرایی 70',kind:'text',text:'70',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed80:{name:'ژمارەی خێرایی 80',kind:'text',text:'80',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed90:{name:'ژمارەی خێرایی 90',kind:'text',text:'90',w:2,h:2,note:'هێمای ژمارەی خێرایی.'},
 speed100:{name:'ژمارەی خێرایی 100',kind:'text',text:'100',w:2.4,h:2.8,note:'هێمای ژمارەی خێرایی.'},
 speed110:{name:'ژمارەی خێرایی 110',kind:'text',text:'110',w:2.4,h:2.8,note:'هێمای ژمارەی خێرایی.'},
 speed120:{name:'ژمارەی خێرایی 120',kind:'text',text:'120',w:2.4,h:2.8,note:'هێمای ژمارەی خێرایی.'},
 bicycle:{name:'هێمای پاسکیل',kind:'text',text:'🚲',w:.63,h:1,note:'هێمای 623.3A بۆ پەڕینەوە؛ 63 cm × 1.00 m.'},
 custom:{name:'نووسینی تایبەت',kind:'text',text:'KS',w:2.4,h:1.6,note:'نووسینەکە و پێوانەکان خۆت دیاری بکە.'}
};
let active='stop';
const num=id=>Math.max(0,Number($('#'+id)?.value)||0);
function arrowSvg(t){const flip=t.dir==='left'?'scale(-1 1)':'';if(t.dir==='up')return `<g><path d="M50 8 L22 40 H40 V92 H60 V40 H78 Z"/></g>`;if(t.dir==='straightRight'||t.dir==='straightLeft')return `<g transform="${t.dir==='straightLeft'?'scale(-1 1) translate(-100 0)':''}"><path d="M45 8L25 32h12v60h18V56h12v14l25-25-25-25v14H55V32h12Z"/></g>`;if(t.dir==='leftRight')return `<g><path d="M8 45l25-25v15h34V20l25 25-25 25V55H33v15Z"/></g>`;if(t.dir==='uturn'||t.dir==='straightUturn')return `<g><path d="M72 92V45c0-28-44-28-44 0v12H15l22 24 22-24H46V45c0-7 8-7 8 0v47Z"/></g>`;return `<g transform="${flip}"><path d="M18 32 H58 V14 L92 50 L58 86 V68 H18 Z"/></g>`}
function textMetrics(t,w,h){const count=Math.max(1,[...String(t.text||'')].filter(x=>x.trim()).length),letter=w/(count+(count-1)/3),gap=count>1?letter/3:0,stroke=letter/4,cell=(Math.abs(w*10-Math.round(w*10))<.001&&Math.abs(h*10-Math.round(h*10))<.001)?.1:.05;return {count,letter,gap,stroke,cell,rows:Math.max(1,Math.round(h/cell)),cols:Math.max(1,Math.round(w/cell))}}
function drawing(t,w,h){
 let body='',shapeDims='';
 if(t.kind==='zebra'){const count=Math.max(2,Math.floor(w/(t.stripe||.5))),unit=230/count;for(let i=0;i<count;i+=2){const x=35+i*unit;body+=`<rect x="${x}" y="45" width="${unit}" height="185" rx="2"/>`}shapeDims=`<g stroke="#58d68d" stroke-width="1.4" fill="none"><path d="M35 28h${unit}M35 23v10M${35+unit} 23v10"/><path d="M${35+unit} 40h${unit}M${35+unit} 35v10M${35+unit*2} 35v10"/><path d="M278 45v185M273 45h10M273 230h10"/></g><g fill="#58d68d" font-size="8" font-family="Arial" direction="ltr"><text x="${35+unit/2}" y="19" text-anchor="middle">${Math.round((t.stripe||.5)*100)} cm</text><text x="${35+unit*1.5}" y="52" text-anchor="middle">${Math.round((t.stripe||.5)*100)} cm</text><text x="289" y="138" text-anchor="middle" transform="rotate(90 289 138)">${h.toFixed(2)} m</text></g>`}
 else if(t.kind==='giveway'){const side=Math.sqrt(h*h+(w/2)*(w/2));body='<path d="M55 52H245L150 230Z" fill="none" stroke="#fff" stroke-width="14" stroke-linejoin="round"/>';shapeDims=`<g stroke="#58d68d" stroke-width="1.4" fill="none"><path d="M55 28H245M55 23v10M245 23v10"/><path d="M266 52v178M261 52h10M261 230h10"/><path d="M50 58L140 225M46 61l8-5M136 228l8-5"/><path d="M126 213h18M126 208v10M144 208v10"/></g><g fill="#58d68d" font-size="8" font-family="Arial" direction="ltr"><text x="150" y="19" text-anchor="middle">${w.toFixed(2)} m</text><text x="278" y="141" text-anchor="middle" transform="rotate(90 278 141)">${h.toFixed(2)} m</text><text x="83" y="145" transform="rotate(62 83 145)" text-anchor="middle">${side.toFixed(2)} m</text><text x="135" y="205" text-anchor="middle">${Math.round((t.stroke||.1)*100)} cm</text></g>`}
 else if(t.kind==='disabled')body='<text x="150" y="190" text-anchor="middle" font-size="150">♿</text>';
 else if(t.kind==='arrow')body=`<g transform="translate(70 20) scale(1.6 2.3)">${arrowSvg(t)}</g>`;
 else body=`<text x="150" y="135" text-anchor="middle" dominant-baseline="middle" direction="ltr" unicode-bidi="bidi-override" textLength="210" lengthAdjust="spacingAndGlyphs" font-family="DejaVu Sans Mono,monospace" font-weight="900" font-size="145">${t.text}</text>`;
 const arrowDims=t.kind==='arrow'?`<g stroke="#58d68d" stroke-width="1.5" fill="none"><path d="M134 238h32M134 233v10M166 233v10"/><path d="M105 120h90M105 115v10M195 115v10"/><path d="M214 38v78M209 38h10M209 116h10"/><path d="M230 116v116M225 116h10M225 232h10"/></g><g fill="#58d68d" font-size="8" font-family="Arial" direction="ltr"><text x="150" y="252" text-anchor="middle">30 cm</text><text x="150" y="112" text-anchor="middle">${w.toFixed(2)} m</text><text x="221" y="77" text-anchor="middle" transform="rotate(90 221 77)">${t.dir==='up'?'2.05 m':'2.50 m'}</text><text x="241" y="174" text-anchor="middle" transform="rotate(90 241 174)">${t.dir==='up'?'2.95 m':Math.max(0,h-2.5).toFixed(2)+' m'}</text></g>`:'';
 let textDims='';
 if(t.kind==='text'){
  const m=textMetrics(t,w,h),gx=230/m.cols,gy=210/m.rows,part=230/(m.count+(m.count-1)/3);
  let grid='';for(let i=0;i<=m.cols;i++)grid+=`<path d="M${35+i*gx} 30V240"/>`;for(let i=0;i<=m.rows;i++)grid+=`<path d="M35 ${30+i*gy}H265"/>`;
  let top='',x=35;for(let i=0;i<m.count;i++){top+=`<path d="M${x} 21h${part}M${x} 17v8M${x+part} 17v8"/><text x="${x+part/2}" y="14" text-anchor="middle">${Math.round(m.letter*100)} cm</text>`;x+=part;if(i<m.count-1){const g=part/3;top+=`<path d="M${x} 21h${g}M${x} 17v8M${x+g} 17v8"/><text x="${x+g/2}" y="28" text-anchor="middle">${Math.round(m.gap*100)} cm</text>`;x+=g}}
  const right=`<path d="M278 30V240M273 30h10M273 240h10"/><text x="289" y="135" text-anchor="middle" transform="rotate(90 289 135)">${h.toFixed(2)} m</text>`;
  const sw=Math.max(8,part*.22),stroke=`<path d="M42 205h${sw}M42 200v10M${42+sw} 200v10"/><text x="${42+sw/2}" y="218" text-anchor="middle">${Math.round(m.stroke*100)} cm</text>`;
  textDims=`<g stroke="#59615d" stroke-width=".55" opacity=".72" fill="none">${grid}</g><g stroke="#58d68d" stroke-width="1.3" fill="none">${top.replace(/<text[\s\S]*?<\/text>/g,'')}${right.replace(/<text[\s\S]*?<\/text>/g,'')}${stroke.replace(/<text[\s\S]*?<\/text>/g,'')}</g><g fill="#58d68d" font-size="7.5" font-family="Arial" direction="ltr" unicode-bidi="bidi-override">${top.match(/<text[\s\S]*?<\/text>/g)?.join('')||''}${right.match(/<text[\s\S]*?<\/text>/g)?.join('')||''}${stroke.match(/<text[\s\S]*?<\/text>/g)?.join('')||''}<text x="150" y="254" text-anchor="middle">${Math.round(m.cell*100)} cm × ${Math.round(m.cell*100)} cm</text></g>`;
 }
 let universalGrid='';if(t.kind!=='text'){const cols=Math.max(1,Math.round(w/.2)),rows=Math.max(1,Math.round(h/.2)),gx=230/cols,gy=210/rows;for(let i=0;i<=cols;i++)universalGrid+=`<path d="M${35+i*gx} 30V240"/>`;for(let i=0;i<=rows;i++)universalGrid+=`<path d="M35 ${30+i*gy}H265"/>`}
 const ownSides=['text','zebra','giveway'].includes(t.kind),topSide=ownSides?'':`<path d="M35 10H265M35 5v10M265 5v10"/>`,rightSide=ownSides?'':`<path d="M292 30V240M287 30h10M287 240h10"/>`,topLabel=ownSides?'':`<text x="150" y="9" text-anchor="middle">${w.toFixed(2)} m</text>`,rightLabel=ownSides?'':`<text x="299" y="135" text-anchor="middle" transform="rotate(90 299 135)">${h.toFixed(2)} m</text>`;
 const universalDims=`<g stroke="#f4c400" stroke-width="2" fill="none">${topSide}${rightSide}<path d="M15 275H285M15 269v12M285 269v12"/><path d="M8 20V250M2 20h12M2 250h12"/></g><g fill="#f4c400" font-size="10" font-family="Arial" direction="ltr" unicode-bidi="bidi-override">${topLabel}${rightLabel}<text x="150" y="294" text-anchor="middle">${w.toFixed(2)} m</text><text x="10" y="140" text-anchor="middle" transform="rotate(-90 10 140)">${h.toFixed(2)} m</text></g>`;
 return `<svg id="mdSvg" viewBox="0 0 310 300" xmlns="http://www.w3.org/2000/svg"><rect width="310" height="300" rx="18" fill="#202322"/><g stroke="#454b48" stroke-width=".45" opacity=".55" fill="none">${universalGrid}</g>${textDims}<g fill="#fff">${body}</g>${shapeDims}${arrowDims}${universalDims}</svg>`;
}
function speedPreset(t,speed){if(!t.speedBased)return;if(t.kind==='arrow'){t.h=speed<40?2.5:speed>=120?7.5:5}else if(t.kind==='text'){t.h=speed<60?1.6:speed<=100?2.8:4.5}}
function renderResult(){
 const t=templates[active],w=num('mdW'),h=num('mdH'),speed=num('mdSpeed');
 const sm=t.kind==='text'?textMetrics(t,w,h):null;
 const stopDetail=sm?[["پانی هەر ژمارە/پیت",`${Math.round(sm.letter*100)} cm`],["بۆشایی نێوانیان",`${Math.round(sm.gap*100)} cm`],["ئەستوری هێڵی بۆیاخ",`${Math.round(sm.stroke*100)} cm`],["گریدی زەرعکردن",`${Math.round(sm.cell*100)} cm × ${Math.round(sm.cell*100)} cm`]]:[];
 const detail=[...(t.details||[]),...stopDetail].map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 const stripe=t.kind==='zebra'?`<div><span>پانی هەر هێڵ</span><b>${((t.stripe||.5)*100).toFixed(0)} cm</b></div><div><span>بۆشایی نێوان هێڵەکان</span><b>${((t.stripe||.5)*100).toFixed(0)} cm</b></div>`:t.kind==='giveway'?`<div><span>ئەستوری هێڵ</span><b>${Math.round((t.stroke||.1)*100)} cm</b></div><div><span>درێژی هەر لای لار</span><b>${Math.sqrt(h*h+(w/2)*(w/2)).toFixed(2)} m</b></div>`:'';
 $('#mdResult').innerHTML=`<div class="md-preview">${drawing(t,w,h)}</div><div class="md-data"><h3>${t.name}</h3><div class="md-measures"><div><span>پانی گشتی</span><b>${w.toFixed(2)} m</b></div><div><span>درێژی گشتی</span><b>${h.toFixed(2)} m</b></div>${stripe}${detail}<div><span>خێرایی</span><b>${speed.toFixed(0)} km/h</b></div></div><p>${t.note}</p><p class="md-source">DTCDM 2nd Edition (2015), Volume 2 — Chapter 6</p><button class="md-download" onclick="downloadMarkingSvg()">⇩ دابەزاندنی نەخشە SVG</button></div>`;
}
function select(key){
 active=key;const t=templates[key];speedPreset(t,num('mdSpeed')||60);
 $('#mdW').value=t.w;$('#mdH').value=t.h;$('#mdSelect').value=key;renderResult();
}
window.markingDesignerView=function(){
 const v=$('#view');if(!v)return;
 v.innerHTML=`<section class="md-head"><button onclick="homeView()">‹ گەڕانەوە</button><div><b>دروستکەری نەخشەی مەیدانی</b><small>پێوانەکانی Dubai DTCDM</small></div></section><section class="md-search"><label>هێماکە هەڵبژێرە</label><select id="mdSelect">${Object.entries(templates).filter(([k])=>k!=='custom').map(([k,t])=>`<option value="${k}">${t.name}</option>`).join('')}</select></section><section class="md-controls"><label>خێرایی شەقام <div><input id="mdSpeed" type="number" value="60" min="0" step="10"><em>km/h</em></div></label><label>پانی گشتی <div><input id="mdW" type="number" min="0" step=".01"><em>m</em></div></label><label>درێژی گشتی <div><input id="mdH" type="number" min="0" step=".01"><em>m</em></div></label></section><section id="mdResult" class="md-result"></section><p class="md-warning">تێبینی: پێش جێبەجێکردن نەخشە و Specification ـی پڕۆژە و ڕەزامەندی ئەندازیاری چاودێر پشتڕاست بکەرەوە.</p>`;
 $('#mdSelect').addEventListener('change',e=>select(e.target.value));
 $('#mdSpeed').addEventListener('change',()=>select(active));['mdW','mdH'].forEach(id=>$('#'+id)?.addEventListener('input',renderResult));select('stop');
};
window.downloadMarkingSvg=function(){const svg=$('#mdSvg');if(!svg)return;const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='KS-marking-plan.svg';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
const st=document.createElement('style');st.textContent=`.md-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}.md-head button{border:1px solid var(--line);background:#171919;color:#fff;border-radius:12px;padding:10px}.md-head div{flex:1}.md-head b,.md-head small{display:block}.md-head b{font-size:19px}.md-head small{color:var(--yellow);font-size:11px}.md-search,.md-controls,.md-result{background:#101212;border:1px solid var(--line);border-radius:18px;padding:13px;margin-bottom:12px}.md-search label{font-weight:800;font-size:14px}.md-search>select{width:100%;margin-top:8px;background:#080909;border:1px solid #414541;border-radius:13px;padding:13px;color:#fff;font-size:16px}.md-controls{display:grid;grid-template-columns:1fr 1fr;gap:9px}.md-controls label{background:#171919;border:1px solid #303333;border-radius:13px;padding:10px;font-size:13px;font-weight:800}.md-controls label>div{display:flex;direction:ltr;align-items:center;gap:6px;margin-top:6px}.md-controls input{width:100%;min-width:0;background:#090a0a;color:#fff;border:1px solid #404443;border-radius:9px;padding:9px;font-size:16px}.md-controls em{font-style:normal;color:var(--muted);font-size:11px}.md-result{display:grid;grid-template-columns:1fr 1fr;gap:13px}.md-preview svg{width:100%;height:auto}.md-data h3{margin:0 0 8px;color:var(--yellow)}.md-measures{display:grid;grid-template-columns:1fr 1fr;gap:7px}.md-measures div{background:#080a09;border-radius:10px;padding:8px}.md-measures span,.md-measures b{display:block}.md-measures span{font-size:10px;color:var(--muted)}.md-measures b{margin-top:3px;font-size:14px}.md-data p{font-size:11px;line-height:1.7;color:#c5cbc7}.md-source{direction:ltr;text-align:left}.md-download{width:100%;border:0;border-radius:11px;background:var(--yellow);color:#111;padding:10px;font-weight:900}.md-warning{font-size:11px;line-height:1.8;color:#c9c3a8;background:#282307;border:1px solid #5c4d0a;border-radius:13px;padding:11px}@media(max-width:620px){.md-result{grid-template-columns:1fr}.md-controls{grid-template-columns:1fr 1fr}}`;document.head.appendChild(st);
})();
