/* KS Field Marking Designer — Dubai DTCDM based */
(()=>{
const $=s=>document.querySelector(s);
const templates={
 stop:{name:'STOP / وەستان',kind:'text',text:'STOP',w:2.4,h:1.6,note:'نووسینی سەر شەقام؛ قەبارەکە بەپێی خێرایی دەگۆڕێت.',details:[['بەرزی پیت','1.60 m'],['پانی گشتی','2.40 m']]},
 zebra:{name:'زێبرا',kind:'zebra',w:4,h:3,stripe:.5,note:'پانی هەر بەشی زێبرا لە DTCDM ـدا 50 cm ـە.'},
 disabled:{name:'شوێنی خاوەن پێداویستی تایبەت',kind:'disabled',w:1.5,h:2,note:'هێمای 623.4؛ قەبارەی فەرمی 1.50 × 2.00 m.'},
 straight:{name:'تیری ڕاستەوخۆ',kind:'arrow',dir:'up',w:1.3,h:5,note:'614.1؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی کلک','2.95 m'],['درێژی سەری تیر','2.05 m'],['پانی گشتی','1.30 m'],['درێژی گشتی','5.00 m']]},
 right:{name:'تیری لای ڕاست',kind:'arrow',dir:'right',w:2.4,h:5,note:'614.2؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی تا شوێنی سووڕانەوە','2.50 m'],['پانی گشتی','2.40 m'],['درێژی گشتی','5.00 m']]},
 left:{name:'تیری لای چەپ',kind:'arrow',dir:'left',w:2.4,h:5,note:'614.3؛ نەخشەی زەرعکردنی ورد.',details:[['پانی کلک','30 cm'],['درێژی تا شوێنی سووڕانەوە','2.50 m'],['پانی گشتی','2.40 m'],['درێژی گشتی','5.00 m']]},
 bicycle:{name:'هێمای پاسکیل',kind:'text',text:'🚲',w:.63,h:1,note:'هێمای 623.3A بۆ پەڕینەوە؛ 63 cm × 1.00 m.'},
 custom:{name:'نووسینی تایبەت',kind:'text',text:'KS',w:2.4,h:1.6,note:'نووسینەکە و پێوانەکان خۆت دیاری بکە.'}
};
let active='stop';
const num=id=>Math.max(0,Number($('#'+id)?.value)||0);
function arrowSvg(t){const flip=t.dir==='left'?'scale(-1 1)':'';if(t.dir==='up')return `<g><path d="M50 8 L22 40 H40 V92 H60 V40 H78 Z"/></g>`;return `<g transform="${flip}"><path d="M18 32 H58 V14 L92 50 L58 86 V68 H18 Z"/></g>`}
function drawing(t,w,h){
 let body='';
 if(t.kind==='zebra'){const count=Math.max(1,Math.floor(w/(t.stripe||.5)));for(let i=0;i<count;i+=2){const x=15+i*(270/count);body+=`<rect x="${x}" y="20" width="${270/count}" height="230" rx="2"/>`}}
 else if(t.kind==='disabled')body='<text x="150" y="190" text-anchor="middle" font-size="150">♿</text>';
 else if(t.kind==='arrow')body=`<g transform="translate(70 20) scale(1.6 2.3)">${arrowSvg(t)}</g>`;
 else body=`<text x="150" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="${String(t.text).length>6?45:75}">${t.text}</text>`;
 const arrowDims=t.kind==='arrow'?`<g stroke="#58d68d" stroke-width="1.5" fill="none"><path d="M126 225h48M126 220v10M174 220v10"/><path d="M196 24v92M191 24h10M191 116h10"/></g><g fill="#58d68d" font-size="10" font-family="Arial"><text x="150" y="218" text-anchor="middle">کلک 30 cm</text><text x="207" y="72" transform="rotate(90 207 72)" text-anchor="middle">${t.dir==='up'?'سەر 2.05 m':'تا سووڕانەوە 2.50 m'}</text></g>`:'';
 return `<svg id="mdSvg" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="300" rx="18" fill="#202322"/><g fill="#fff">${body}</g>${arrowDims}<g stroke="#f4c400" stroke-width="2" fill="none"><path d="M15 275H285M15 269v12M285 269v12"/><path d="M8 20V250M2 20h12M2 250h12"/></g><g fill="#f4c400" font-size="13" font-family="Arial"><text x="150" y="294" text-anchor="middle">پانی ${w.toFixed(2)} m</text><text x="10" y="140" text-anchor="middle" transform="rotate(-90 10 140)">درێژی ${h.toFixed(2)} m</text></g></svg>`;
}
function speedPreset(t,speed){if(t.kind==='arrow'){t.h=speed<40?2.5:speed>=120?7.5:5}else if(t.kind==='text'){t.h=speed<60?1.6:speed<=100?2.8:4.5}}
function renderResult(){
 const t=templates[active],w=num('mdW'),h=num('mdH'),speed=num('mdSpeed');
 const detail=(t.details||[]).map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
 const stripe=t.kind==='zebra'?`<div><span>پانی هەر هێڵ</span><b>${((t.stripe||.5)*100).toFixed(0)} cm</b></div>`:'';
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
