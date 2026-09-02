/* KS Calculator v3 — simple Kurdish-first field workflow */
(function(){
const PAINT={
 thermo:{name:'سێرمۆ',rate:4,beads:.45,pack:25},
 cold:{name:'بۆیاخی سارد ئەکریلیک',rate:.60,beads:.35,pack:20},
 water:{name:'ئەکریلیکی بنەمای ئاو',rate:.60,beads:.35,pack:20},
 mma:{name:'پلاستیکی سارد / MMA',rate:3,beads:.45,pack:25},
 twoK:{name:'بۆیاخی دوو کۆمپۆنێت',rate:.60,beads:.35,pack:20}
};
const SURFACE={
 smooth:{name:'ئاسفاڵتی نوێ و نەرم',factor:1},
 rough:{name:'ئاسفاڵتی کۆن و زبر',factor:1.10},
 concrete:{name:'کۆنکریت',factor:1.08},
 pavers:{name:'کەلەبستۆن',factor:1.20}
};
const $=s=>document.querySelector(s);
const n=id=>Math.max(0,Number($('#'+id)?.value)||0);
const input=(label,id,value,unit,step='.01')=>`<label class="c3-field"><span>${label}</span><div><input id="${id}" type="number" min="0" step="${step}" value="${value}" inputmode="decimal"><em>${unit}</em></div></label>`;
const paintSelect=()=>`<label class="c3-field"><span>جۆری بۆیاخ</span><select id="cPaint">${Object.entries(PAINT).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select></label>`;
const surfaceSelect=()=>`<label class="c3-field"><span>ڕووی شەقام</span><select id="cSurface">${Object.entries(SURFACE).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select></label>`;
function settings(){
 const p=PAINT[$('#cPaint')?.value]||PAINT.thermo;
 return `<details class="c3-advanced"><summary>ڕێکخستنی ورد</summary><div class="c3-grid">
 ${input('ڕێژەی بۆیاخ','cRate',p.rate,'kg/m²')}
 ${input('دانی شووشەیی','cBeads',p.beads,'kg/m²')}
 ${input('زیادەی کار','cWaste',5,'%','.5')}
 ${input('قەبارەی کیسە/قوطی','cPack',p.pack,'kg','1')}
 </div><p>ئەگەر TDS ـی بەرهەمەکەت ژمارەی جیاواز دەڵێت، لێرە بیگۆڕە.</p></details>`;
}
function shell(title,help,fields){
 return `<div class="c3-top"><button class="c3-back" type="button" onclick="calcTool()">‹ گەڕانەوە</button><div><b>${title}</b><small>${help}</small></div></div><div class="c3-form"><div class="c3-grid">${fields}</div>${settings()}</div><div id="c3Results" class="c3-results"></div>`;
}
function result(area,paint,beads,extra=''){
 const pack=n('cPack')||25, packs=Math.ceil(paint/pack);
 $('#c3Results').innerHTML=`<h3>ئەنجامی خەمڵاندن</h3><div class="c3-main-result"><span>بۆیاخی پێویست</span><strong>${paint.toFixed(2)}</strong><b>kg</b></div><div class="c3-result-grid"><div><span>ڕووبەر</span><b>${area.toFixed(2)} m²</b></div><div><span>دانی شووشەیی</span><b>${beads.toFixed(2)} kg</b></div><div><span>کیسە/قوطی ${pack} kg</span><b>${packs} دانە</b></div>${extra}</div><p>ئەنجامەکە زیادەی کاری ${n('cWaste').toFixed(1)}% لەخۆ دەگرێت.</p>`;
}
function values(area){
 const p=PAINT[$('#cPaint').value],s=SURFACE[$('#cSurface').value],w=1+n('cWaste')/100;
 return {paint:area*n('cRate')*s.factor*w,beads:area*n('cBeads')*w,p,s};
}
function bind(calc){
 ['input','change'].forEach(ev=>$('#calcBody').addEventListener(ev,e=>{
  if(e.target.id==='cPaint'){const p=PAINT[e.target.value];$('#cRate').value=p.rate;$('#cBeads').value=p.beads;$('#cPack').value=p.pack}
  calc();
 }));
 calc();
}
window.calcTool=function(){
 const t=$('#toolBody');if(!t)return;
 t.innerHTML=`<section class="c3-intro"><b>هەژمارکەری کاری شەقام</b><p>ئەو کارە هەڵبژێرە کە دەتەوێت هەژماری بکەیت.</p></section>
 <div class="c3-choices">
 <button onclick="renderCalc('line')"><i>━</i><b>هێڵی شەقام</b><small>بەردەوام یان پچڕاو</small></button>
 <button onclick="renderCalc('zebra')"><i>▥</i><b>زێبرا و نیشانە</b><small>ژمارە و پێوانەی هێڵەکان</small></button>
 <button onclick="renderCalc('area')"><i>□</i><b>ڕووبەر و بۆیاخ</b><small>لە m² بۆ kg</small></button>
 <button onclick="renderCalc('mix')"><i>◒</i><b>تێکەڵکردنی 2K</b><small>بنەڕەت و هاردنەر</small></button>
 </div><div id="calcBody"></div>`;
};
window.renderCalc=function(type){
 const c=$('#calcBody');if(!c)return;
 if(type==='line'){
  c.innerHTML=shell('هێڵی شەقام','درێژی و پانی داخڵ بکە',`
  <label class="c3-field"><span>جۆری هێڵ</span><select id="lineKind"><option value="solid">بەردەوام</option><option value="broken">پچڕاو</option></select></label>
  ${input('کۆی درێژی','lineLength',1000,'m','1')}${input('پانی هێڵ','lineWidth',15,'cm','.1')}
  <div id="brokenFields" class="c3-subgrid" hidden>${input('درێژی بەشی بۆیاخکراو','markLength',3,'m','.1')}${input('بۆشایی نێوانیان','gapLength',9,'m','.1')}</div>
  ${paintSelect()}${surfaceSelect()}`);
  bind(()=>{const broken=$('#lineKind').value==='broken';$('#brokenFields').hidden=!broken;const L=n('lineLength'),mark=n('markLength'),gap=n('gapLength'),cycle=mark+gap;let painted=L;if(broken)painted=cycle?Math.floor(L/cycle)*mark+Math.min(L%cycle,mark):0;const area=painted*n('lineWidth')/100,v=values(area);result(area,v.paint,v.beads,broken?`<div><span>درێژی بۆیاخکراو</span><b>${painted.toFixed(2)} m</b></div>`:'')});return;
 }
 if(type==='zebra'){
  c.innerHTML=shell('زێبرا و نیشانە','ژمارە و پێوانەی هەر بەش داخڵ بکە',`
  ${input('ژمارەی هێڵ/بەش','stripeCount',8,'دانە','1')}${input('درێژی هەر بەش','stripeLength',4,'m','.01')}${input('پانی هەر بەش','stripeWidth',.5,'m','.01')}
  ${paintSelect()}${surfaceSelect()}`);
  bind(()=>{const area=n('stripeCount')*n('stripeLength')*n('stripeWidth'),v=values(area);result(area,v.paint,v.beads)});return;
 }
 if(type==='area'){
  c.innerHTML=shell('ڕووبەر و بڕی بۆیاخ','ڕووبەری کارەکە بە m² بنووسە',`
  ${input('ڕووبەری کار','workArea',100,'m²','1')}${paintSelect()}${surfaceSelect()}`);
  bind(()=>{const area=n('workArea'),v=values(area);result(area,v.paint,v.beads)});return;
 }
 c.innerHTML=`<div class="c3-top"><button class="c3-back" type="button" onclick="calcTool()">‹ گەڕانەوە</button><div><b>تێکەڵکردنی 2K</b><small>ڕێژەکە لە TDS وەربگرە</small></div></div><div class="c3-form"><div class="c3-grid">${input('کۆی تێکەڵ','mixTotal',100,'kg','.1')}${input('بەشی ماددەی بنەڕەت','basePart',98,'بەش','.1')}${input('بەشی هاردنەر','hardPart',2,'بەش','.1')}</div></div><div id="c3Results" class="c3-results"></div>`;
 bind(()=>{const total=n('mixTotal'),base=n('basePart'),hard=n('hardPart'),sum=base+hard,b=sum?total*base/sum:0,h=sum?total*hard/sum:0;$('#c3Results').innerHTML=`<h3>ئەنجامی تێکەڵ</h3><div class="c3-main-result"><span>ماددەی بنەڕەت</span><strong>${b.toFixed(2)}</strong><b>kg</b></div><div class="c3-result-grid"><div><span>هاردنەر</span><b>${h.toFixed(2)} kg</b></div><div><span>کۆی تێکەڵ</span><b>${total.toFixed(2)} kg</b></div></div><p>پێش تێکەڵکردن ڕێژەی TDS ـی بەرهەمەکەت دڵنیا بکەرەوە.</p>`});
};
const st=document.createElement('style');st.textContent=`
.c3-intro{padding:18px;border-radius:20px;background:linear-gradient(135deg,#211d08,#0e1010);border:1px solid #5a4b0d;margin-bottom:12px}.c3-intro b{font-size:20px}.c3-intro p{margin:6px 0 0;color:var(--muted);font-size:14px}
.c3-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c3-choices button{min-height:132px;text-align:right;padding:16px;border:1px solid var(--line);border-radius:18px;background:#121414;color:var(--text)}.c3-choices i{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:var(--yellow);color:#111;font-size:24px;font-style:normal;margin-bottom:12px}.c3-choices b,.c3-choices small{display:block}.c3-choices b{font-size:16px}.c3-choices small{font-size:13px;color:var(--muted);margin-top:5px}
.c3-top{display:flex;align-items:center;gap:12px;margin:14px 0 10px}.c3-top>div{flex:1}.c3-top b,.c3-top small{display:block}.c3-top b{font-size:19px}.c3-top small{font-size:13px;color:var(--muted);margin-top:3px}.c3-back{border:1px solid var(--line);background:#171919;color:var(--text);border-radius:12px;padding:10px 12px;font-size:14px}
.c3-form{background:#0f1111;border:1px solid var(--line);border-radius:18px;padding:12px}.c3-grid,.c3-subgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c3-subgrid{grid-column:1/-1}.c3-field{display:block;background:#171919;border:1px solid #303333;border-radius:14px;padding:11px}.c3-field>span{display:block;font-size:14px;font-weight:800;margin-bottom:7px}.c3-field>div{display:flex;direction:ltr;align-items:center;gap:8px}.c3-field input,.c3-field select,.c3-field>select{width:100%;min-height:46px;border:1px solid #414541;background:#0d0f0f;color:var(--text);border-radius:11px;padding:9px;font-size:17px}.c3-field em{font-size:13px;color:var(--muted);font-style:normal;white-space:nowrap}
.c3-advanced{margin-top:10px;border-top:1px solid var(--line);padding-top:10px}.c3-advanced summary{cursor:pointer;color:var(--yellow);font-size:14px;font-weight:800;padding:7px}.c3-advanced p{font-size:12px;color:var(--muted);line-height:1.7;margin:8px}
.c3-results{margin-top:12px;border-radius:18px;background:#161914;border:1px solid #5a4b0d;padding:14px}.c3-results h3{font-size:14px;color:var(--yellow);margin:0 0 10px}.c3-main-result{display:flex;align-items:end;gap:8px;background:var(--yellow);color:#111;border-radius:16px;padding:15px}.c3-main-result span{flex:1;font-weight:900}.c3-main-result strong{font-size:31px;line-height:1}.c3-main-result b{font-size:14px}.c3-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}.c3-result-grid>div{background:#0f1110;border:1px solid var(--line);border-radius:12px;padding:10px}.c3-result-grid span,.c3-result-grid b{display:block}.c3-result-grid span{font-size:12px;color:var(--muted)}.c3-result-grid b{font-size:16px;margin-top:4px}.c3-results>p{font-size:12px;color:var(--muted);margin:10px 2px 0}
@media(max-width:650px){.c3-choices{grid-template-columns:1fr 1fr}.c3-grid,.c3-subgrid{grid-template-columns:1fr}.c3-subgrid{grid-column:auto}.c3-field{padding:10px}.c3-result-grid{grid-template-columns:1fr 1fr}}
`;document.head.appendChild(st);
})();