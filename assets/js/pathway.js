/* GESEA Pathway diagram.
   The WORDS come from _data/pathway.yml. This file holds the SHAPE of the diagram
   (box positions, arrows, order of the steps) - change it together with the developer. */
(function(){
"use strict";
if(!document.getElementById('pwSvg')||!window.GESEA_PATHWAY)return;
const {RM,G,$,$$,el,esc,scrollToY}=window.GESEA;
const PD=window.GESEA_PATHWAY;
/* ================= PATHWAY (structure from the official GESEA Pathway graphic) ================= */
const DISC=PD.disciplines.map(d=>d.name);
const DISC_TRACK=PD.disciplines.map(d=>d.track==='both'?'mix':d.track);
const DY=[100,212,324,436,548,660];
const N={
  l1:{s:'dia',x:100,y:380,r:70,lines:[['LEVEL 1',24,700]],tr:'mix'},
  l2:{s:'dia',x:270,y:380,r:70,lines:[['LEVEL 2',24,700]],tr:'mix'},
  robc:{s:'dia',x:470,y:380,r:92,lines:[['GESEA',21,700],['ROBOTICS',21,700],['Certificate',17,400],['(optional)',17,400]],tr:'rob'},
  migs:{s:'rect',x:665,y:177,w:220,h:76,lines:[['GESEA MIGS',23,700],['Diploma',17,400]],tr:'migs'},
  robd:{s:'rect',x:665,y:342,w:220,h:76,lines:[['GESEA ROBOTICS',21,700],['Diploma (optional)',17,400]],tr:'rob'},
  ecres:{s:'rect',x:665,y:507,w:220,h:76,lines:[['GESEA ECRES',23,700],['Diploma',17,400]],tr:'ecres'},
  expM:{s:'rect',x:915,y:177,w:210,h:76,lines:[['EXPERT Level',23,700],['Diploma',17,400]],tr:'migs'},
  expE:{s:'rect',x:915,y:507,w:210,h:76,lines:[['EXPERT Level',23,700],['Diploma',17,400]],tr:'ecres'},
};
DISC.forEach((d,i)=>{N['x'+i]={s:'rect',x:1215,y:DY[i]-23,w:228,h:46,lines:[[d,18,500]],tr:DISC_TRACK[i],left:true}});
const E=[
  {id:'l1-l2',a:'l1',b:'l2',c:'mix',d:'M170 380 L198 380'},
  {id:'l2-migs',a:'l2',b:'migs',c:'migs',d:'M305 345 L437 215 L663 215'},
  {id:'l2-ecres',a:'l2',b:'ecres',c:'ecres',d:'M305 415 L437 545 L663 545'},
  {id:'l2-robc',a:'l2',b:'robc',c:'rob',d:'M340 380 L376 380'},
  {id:'robc-robd',a:'robc',b:'robd',c:'rob',d:'M562 380 L663 380'},
  {id:'migs-robc',a:'migs',b:'robc',c:'rob',d:'M665 253 L519 331'},
  {id:'ecres-robc',a:'ecres',b:'robc',c:'rob',d:'M665 507 L519 429'},
  {id:'migs-robd',a:'migs',b:'robd',c:'rob',d:'M775 253 L775 340'},
  {id:'ecres-robd',a:'ecres',b:'robd',c:'rob',d:'M775 507 L775 420'},
  {id:'migs-expM',a:'migs',b:'expM',c:'migs',d:'M885 215 L913 215'},
  {id:'ecres-expE',a:'ecres',b:'expE',c:'ecres',d:'M885 545 L913 545'},
];
[0,1,2,3,4].forEach(i=>E.push({id:'expM-x'+i,a:'expM',b:'x'+i,c:'migs',d:`M1125 215 L1160 215 L1160 ${DY[i]} L1213 ${DY[i]}`}));
[3,4,5].forEach(i=>E.push({id:'expE-x'+i,a:'expE',b:'x'+i,c:'ecres',d:`M1125 545 L1185 545 L1185 ${DY[i]} L1213 ${DY[i]}`}));

const STEPS=[
  {key:'overview',edges:[],nodes:[]},
  {key:'l1',edges:[],nodes:['l1']},
  {key:'l2',edges:['l1-l2'],nodes:['l2']},
  {key:'dip',edges:['l2-migs','l2-ecres'],nodes:['migs','ecres']},
  {key:'rob',edges:['l2-robc','robc-robd','migs-robc','ecres-robc','migs-robd','ecres-robd'],nodes:['robc','robd']},
  {key:'exp',edges:['migs-expM','ecres-expE',...E.filter(e=>/^exp[ME]-x/.test(e.id)).map(e=>e.id)],nodes:['expM','expE',...DISC.map((_,i)=>'x'+i)]},
  {key:'all',edges:[],nodes:'all'},
];


/* turn the YAML text into the shape the diagram code uses */
const toLinks=a=>(a||[]).map(x=>({t:esc(x[0]),h:x[1]}));
const INFO={};
Object.keys(PD.stages).forEach(k=>{const s=PD.stages[k];INFO[k]={k:esc(s.kicker),t:esc(s.title),p:esc(s.text),rows:(s.facts||[]).map(f=>[esc(f[0]),esc(f[1])]),note:s.note||null,chips:s.options||[],links:toLinks(s.links)}});
const TRK={migs:'MIGS TRACK',ecres:'ECRES TRACK',mix:'MIGS AND ECRES TRACKS'};
PD.disciplines.forEach((d,i)=>{INFO['x'+i]={k:'EXPERT LEVEL · '+TRK[DISC_TRACK[i]],t:esc(d.name),p:esc(PD.discipline_text),rows:[],
  note:d.link?null:PD.discipline_missing_note,chips:[],links:d.link?[{t:esc(d.name)+' programme',h:d.link}]:[]}});
const STEPTEXT=PD.steps.map(s=>({k:esc(s.kicker),t:esc(s.title),p:esc(s.text),chips:s.options||[]}));
/* relations: ancestors + descendants */
function related(id){
  const nodes=new Set([id]),edges=new Set();
  const up=[id];while(up.length){const n=up.pop();E.forEach(e=>{if(e.b===n){edges.add(e.id);if(!nodes.has(e.a)){nodes.add(e.a);up.push(e.a)}}})}
  const dn=[id];while(dn.length){const n=dn.pop();E.forEach(e=>{if(e.a===n){edges.add(e.id);if(!nodes.has(e.b)){nodes.add(e.b);dn.push(e.b)}}})}
  return {nodes,edges};
}

/* ---------------- pathway diagram ---------------- */
function buildDiagram(svg){
  const defs=el('defs',{},svg);
  const gr=el('linearGradient',{id:'gMix',x1:0,y1:0,x2:0,y2:1},defs);
  el('stop',{offset:'0','stop-color':'#3A78B0'},gr); el('stop',{offset:'1','stop-color':'#43A39A'},gr);
  const grH=el('linearGradient',{id:'gMixH',x1:0,y1:0,x2:1,y2:1},defs);
  el('stop',{offset:'.35','stop-color':'#3A78B0'},grH); el('stop',{offset:'1','stop-color':'#43A39A'},grH);
  const COL={migs:'#3A78B0',ecres:'#43A39A',rob:'#C4589A',mix:'#3F8EA8',ghost:'#D3DCE5'};
  Object.entries(COL).forEach(([k,c])=>{const m=el('marker',{id:'ar-'+k,viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse',markerUnits:'userSpaceOnUse'},defs);
    m.setAttribute('markerWidth',12);m.setAttribute('markerHeight',12);el('path',{d:'M0 0 L10 5 L0 10 z',fill:c},m)});
  const mask=el('mask',{id:'pw-rv',maskUnits:'userSpaceOnUse',x:-20,y:-20,width:1520,height:780},defs);
  // zones
  const gz=el('g',{},svg);
  const zL=el('rect',{x:8,y:70,width:600,height:630,rx:10,class:'zone zl'},gz);
  const zR=el('rect',{x:632,y:70,width:822,height:630,rx:10,class:'zone zr'},gz);
  const tL=el('text',{x:308,y:44,'text-anchor':'middle',class:'zlbl zl'},gz); tL.textContent='Psychomotor Skills Assessment Certificate';
  const tR=el('text',{x:1043,y:44,'text-anchor':'middle',class:'zlbl zr'},gz); tR.textContent='Surgical Skills Assessment Diploma';
  // track brand labels
  const brand=(y,word,tr)=>{const g=el('g',{class:'brand '+tr,transform:`translate(120 ${y})`},gz);
    const a=el('text',{x:0,y:0,class:'bw'},g);a.textContent='GESEA';
    const r=el('rect',{x:110,y:-28,width:word==='MIGS'?84:104,height:38,rx:6,class:'bp'},g);
    const b=el('text',{x:119,y:0,class:'bt'},g);b.textContent=word; return g};
  const bM=brand(150,'MIGS','migs'), bE=brand(625,'ECRES','ecres');
  const gGhost=el('g',{},svg), gEdge=el('g',{mask:'url(#pw-rv)'},svg), gNode=el('g',{},svg);
  const RV={},ED={},NE={};
  E.forEach(e=>{
    const dash=e.c==='rob'?' dash':'';
    el('path',{d:e.d,class:'ghost'+dash,'marker-end':'url(#ar-ghost)'},gGhost);
    ED[e.id]=el('path',{d:e.d,class:'edge '+e.c+dash,'marker-end':`url(#ar-${e.c})`},gEdge);
    RV[e.id]=el('path',{d:e.d,class:'rv'},mask);
  });
  Object.entries(N).forEach(([nid,n])=>{
    const g=el('g',{class:'pnode '+n.tr,tabindex:0,role:'button','data-id':nid,'aria-label':(INFO[nid]?INFO[nid].t:nid)+'. Show details'},gNode);
    let geo;
    if(n.s==='dia'){const r=n.r;geo=(k=0)=>({tag:'polygon',a:{points:`${n.x} ${n.y-r-k} ${n.x+r+k} ${n.y} ${n.x} ${n.y+r+k} ${n.x-r-k} ${n.y}`,'stroke-linejoin':'round'}})}
    else geo=(k=0)=>({tag:'rect',a:{x:n.x-k,y:n.y-k,width:n.w+2*k,height:n.h+2*k,rx:4+k}});
    const G1=geo(9); el(G1.tag,{...G1.a,class:'ring'},g);
    const G0=geo(); el(G0.tag,{...G0.a,class:'pale'},g);
    const fillC = n.tr==='mix' ? (n.s==='dia'?'url(#gMix)':'url(#gMixH)') : COL[n.tr];
    el(G0.tag,{...G0.a,class:'fill',fill:fillC},g);
    const cx = n.s==='dia'? n.x : (n.left? n.x+16 : n.x+16);
    const cy = n.s==='dia'? n.y : n.y+n.h/2;
    const total=n.lines.reduce((s,l)=>s+l[1]*1.18,0);
    let y=cy-total/2;
    n.lines.forEach(([txt,fs,fw])=>{y+=fs*1.18;const t=el('text',{x:cx,y:y-fs*.24,'text-anchor':n.s==='dia'?'middle':'start',class:'nt','font-size':fs,'font-weight':fw},g);t.textContent=txt});
    NE[nid]=g;
  });
  E.forEach(e=>{const p=RV[e.id];const len=Math.ceil(p.getTotalLength())+14;p.style.strokeDasharray=len;p.style.strokeDashoffset=len;p.dataset.len=len;p.style.transition='stroke-dashoffset 1.4s cubic-bezier(.45,0,.25,1)'});
  return {RV,ED,NE,zL,zR,tL,tR,bM,bE};
}

/* ---------------- main pathway ---------------- */
const P=buildDiagram($('#pwSvg'));
const RV=P.RV, ED=P.ED, NE=P.NE;
let step=-1, sel=null, hover=null;
function drawnEdges(s){const out=new Set();for(let i=0;i<=Math.min(s,5);i++){STEPS[i].edges.forEach(x=>out.add(x))} if(s>=6)E.forEach(e=>out.add(e.id)); return out}
function drawnNodes(s){const out=new Set();for(let i=0;i<=Math.min(s,5);i++){STEPS[i].nodes.forEach(x=>out.add(x))} if(s>=6)Object.keys(N).forEach(k=>out.add(k)); return out}
function render(){
  const de=drawnEdges(step), dn=drawnNodes(step);
  E.forEach(e=>{
    const p=RV[e.id]; const on=de.has(e.id);
    const idx=STEPS[step]&&STEPS[step].edges?STEPS[step].edges.indexOf(e.id):-1;
    p.style.transitionDelay = on && idx>0 ? (idx*0.07)+'s':'0s';
    p.style.strokeDashoffset = on?0:p.dataset.len;
  });
  const focus=hover||sel; const rel=focus?related(focus):null;
  const act = STEPS[step].nodes==='all'?null:new Set(STEPS[step].nodes);
  Object.entries(NE).forEach(([id,g])=>{
    const lit=dn.has(id);
    // colour arrives just after the line that leads into the node
    const idx=act&&act.has(id)?[...act].indexOf(id):0;
    g.style.setProperty('--d', lit && act && act.has(id) ? (0.45+idx*0.05)+'s' : '0s');
    g.classList.toggle('lit',lit);
    g.classList.toggle('sel',id===sel);
    g.classList.toggle('active',!!act && act.has(id) && !rel);
    g.classList.toggle('muted',!!rel && !rel.nodes.has(id));
  });
  E.forEach(e=>{const p=ED[e.id];p.classList.toggle('dim',!!rel&&!rel.edges.has(e.id));p.classList.toggle('hot',!!rel&&rel.edges.has(e.id))});
  [P.zL,P.tL].forEach(z=>z.classList.toggle('on',step>=1));
  [P.zR,P.tR].forEach(z=>z.classList.toggle('on',step>=3));
  P.bM.classList.toggle('on',step>=3); P.bE.classList.toggle('on',step>=3);
  $$('#stages button').forEach((b,i)=>b.setAttribute('aria-current',i===step?'step':'false'));
  $('#pwCount').textContent=step+' / 6';
}
function panelHTML(o,isNode){
  let h=`<span class="kicker">${o.k}</span><h3>${o.t}</h3><p>${o.p}</p>`;
  if(o.rows&&o.rows.length) h+='<dl>'+o.rows.map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')+'</dl>';
  if(o.note) h+=`<span class="placeholder-note">${esc(o.note)}</span>`;
  if(o.chips&&o.chips.length) h+='<div class="chips">'+o.chips.map(c=>`<button data-open="${c}">${INFO[c].t} →</button>`).join('')+'</div>';
  if(o.links&&o.links.length) h+='<div class="links">'+o.links.map(l=>`<a class="tlink" href="${l.h}" target="_blank" rel="noopener">${l.t} <span class="ar">→</span></a>`).join('')+'</div>';
  if(isNode) h+='<button class="back" data-back="1">← Back to stage</button>';
  return h;
}
const panel=$('#pwPanel'); let panelTimer=null;
function setPanel(html){clearTimeout(panelTimer);panel.classList.add('out');panelTimer=setTimeout(()=>{panel.innerHTML=html;panel.classList.remove('out')},RM?0:320)}
function showStep(){ setPanel(panelHTML(STEPTEXT[step],false)); }
function setStep(s,force){s=Math.max(0,Math.min(6,s)); if(s===step&&!force)return; step=s; sel=null; render(); showStep();}
function select(id){ if(!INFO[id])return; if(!drawnNodes(step).has(id)){ step=6; } sel=id; render(); setPanel(panelHTML(INFO[id],true)); }
panel.addEventListener('click',e=>{const o=e.target.closest('[data-open]'); if(o){select(o.dataset.open);return} if(e.target.closest('[data-back]')){sel=null;render();showStep()}});
Object.entries(NE).forEach(([id,g])=>{
  g.addEventListener('click',()=>select(id));
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id)}});
  g.addEventListener('mouseenter',()=>{hover=id;render()}); g.addEventListener('mouseleave',()=>{hover=null;render()});
  g.addEventListener('focus',()=>{hover=id;render()}); g.addEventListener('blur',()=>{hover=null;render()});
});
const stagesUl=$('#stages');
const STAGE_LABELS=PD.steps.map(s=>s.label);
STEPS.forEach((s,i)=>{const li=document.createElement('li');const b=document.createElement('button');b.textContent=STAGE_LABELS[i];b.addEventListener('click',()=>goStep(i));li.appendChild(b);stagesUl.appendChild(li)});
let pwST=null;
function goStep(i){ if(pwST){ scrollToY(pwST.start+(pwST.end-pwST.start)*((i+.5)/7)); } else setStep(i,true); }
setStep(0,true);
if(G){
  gsap.matchMedia().add('(min-width:901px) and (min-height:561px)',()=>{
    pwST=ScrollTrigger.create({trigger:'#pwPin',start:'top top',end:'+=420%',pin:true,
      onUpdate:self=>{const s=Math.min(6,Math.floor(self.progress*7)); if(s!==step) setStep(s)},
      snap:{snapTo:v=>{const k=Math.round(v*7-.5);return (Math.max(0,Math.min(6,k))+.5)/7},duration:{min:.4,max:1},delay:.2,ease:'power1.inOut'}});
    return ()=>{pwST=null};
  });
} else setStep(6,true);

/* ---------------- mobile pathway ---------------- */
(function(){
  let track='migs', open=new Set(['l1']);
  const items=$('#pmItems');
  function build(){
    const seq = track==='migs' ? [['l1'],['l2m'],['migs'],['expM'],['robc','opt'],['robd','opt']] : [['l1'],['l2e'],['ecres'],['expE'],['robc','opt'],['robd','opt']];
    let h='';
    seq.forEach(([id,o],i)=>{
      const inf=INFO[id];
      if(i===1) h+='<div class="pm-fork">↳ '+(track==='migs'?'MIGS TRACK · DIPLOMA ISSUED BY THE ESGE':'ECRES TRACK · DIPLOMA ISSUED BY ESHRE')+'</div>';
      if(id==='robc') h+='<div class="pm-fork">↳ OPTIONAL · ROBOTICS</div>';
      const isOpen=open.has(id);
      h+=`<div class="pm-item ${(N[id]||N.l2).tr}${o?' opt':''}${isOpen?' open':''}" data-id="${id}">
        <button aria-expanded="${isOpen}" aria-controls="pmb-${id}"><span class="k">${inf.k}</span><h3>${inf.t}</h3><span class="tog">${isOpen?'– Close':'+ Requirements'}</span></button>
        <div class="pm-body" id="pmb-${id}"><div><div class="in">
          <p>${inf.p}</p>
          ${inf.rows.length?'<dl>'+inf.rows.map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')+'</dl>':''}
          ${inf.note?`<span class="placeholder-note">${inf.note}</span>`:''}
          ${inf.links.map(l=>`<a class="tlink" href="${l.h}" target="_blank" rel="noopener">${l.t} <span class="ar">→</span></a>`).join('')}
        </div></div></div></div>`;
    });
    items.innerHTML=h;
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('lit')}),{rootMargin:'0px 0px -35% 0px'});
    $$('.pm-item',items).forEach(it=>io.observe(it));
  }
  items.addEventListener('click',e=>{
    const b=e.target.closest('.pm-item > button'); if(!b)return;
    const it=b.parentElement, id=it.dataset.id; const isOpen=it.classList.toggle('open');
    isOpen?open.add(id):open.delete(id);
    b.setAttribute('aria-expanded',isOpen); $('.tog',b).textContent=isOpen?'– Close':'+ Requirements';
    if(G) setTimeout(()=>ScrollTrigger.refresh(),850);
  });
  $$('.pm-switch button').forEach(b=>b.addEventListener('click',()=>{track=b.dataset.track;$$('.pm-switch button').forEach(x=>x.setAttribute('aria-pressed',x===b));build()}));
  build();
  if(G) gsap.matchMedia().add('(max-width:900px), (max-height:560px)',()=>{gsap.fromTo('#pmSpine',{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'#pm',start:'top 70%',end:'bottom 70%',scrub:true}})});
})();

})();
