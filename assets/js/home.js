/* GESEA home page behaviour: reveals, certification, OSP tabs, centres map, globe and the logo intro.
   The text of the page is in _data/home.yml. */
(function(){
"use strict";
const {SITE,RM,G,$,$$,el,lenis,scrollToY}=window.GESEA;
/* nav */
(function(){
  const nav=$('#nav'); let lastY=window.scrollY;
  function upd(){const y=window.scrollY; nav.classList.toggle('scrolled',y>10);
    if(y>lastY+4&&y>300)nav.classList.add('away'); else if(y<lastY-4)nav.classList.remove('away'); lastY=y;}
  window.addEventListener('scroll',upd,{passive:true});upd();
})();
/* soft reveals: gentle fade-up, once */
if(G){
  gsap.set('.hero .fade',{y:18,opacity:0});
  $$('main > section:not(.hero) .fade').forEach(e=>gsap.from(e,{y:22,opacity:0,duration:1.3,ease:'power2.out',scrollTrigger:{trigger:e,start:'top 88%',once:true}}));
}

/* ---------------- certification ---------------- */
(function(){
  const list=$('#certList'); if(!list)return;
  const rows=$$('.cert-row',list);
  let cur=0, certST=null;
  function openRow(i,toggle){
    const row=rows[i], was=row.classList.contains('open');
    rows.forEach(r=>{r.classList.remove('open');$('button',r).setAttribute('aria-expanded','false')});
    if(!(toggle&&was)){row.classList.add('open');$('button',row).setAttribute('aria-expanded','true')}
    cur=i;
  }
  rows.forEach((row,i)=>$('button',row).addEventListener('click',()=>{
    if(certST){ scrollToY(certST.start+(certST.end-certST.start)*((i+.5)/rows.length)); return; }
    openRow(i,true);
    if(G) setTimeout(()=>ScrollTrigger.refresh(),950);
  }));
  /* scrolling down opens the next programme in turn */
  if(G){
    const mm=gsap.matchMedia();
    mm.add('(min-width:761px) and (min-height:760px)',()=>{
      certST=ScrollTrigger.create({trigger:list,start:'top 72px',end:'+='+(rows.length*55)+'%',pin:true,
        onUpdate:self=>{const i=Math.min(rows.length-1,Math.floor(self.progress*rows.length)); if(i!==cur) openRow(i)},
        snap:{snapTo:v=>(Math.max(0,Math.min(rows.length-1,Math.round(v*rows.length-.5)))+.5)/rows.length,duration:{min:.3,max:.8},delay:.2,ease:'power1.inOut'}});
      return ()=>{certST=null};
    });
    mm.add('(max-width:760px), (max-height:759px)',()=>{
      const sts=rows.map((row,i)=>i===0?null:ScrollTrigger.create({trigger:row,start:'top 70%',once:true,
        onEnter:()=>{row.classList.add('open');$('button',row).setAttribute('aria-expanded','true');setTimeout(()=>ScrollTrigger.refresh(),950)}}));
      return ()=>sts.forEach(s=>s&&s.kill());
    });
  }
})();


/* ---------------- OSP tabs (lists are written in _data/home.yml) ---------------- */
(function(){
  const tabs=$$('.osp-tabs [role="tab"]'); if(!tabs.length)return;
  function show(k,anim){
    tabs.forEach(b=>{const on=b.dataset.k===k;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1});
    $$('.osp-list').forEach(l=>{const on=l.dataset.k===k; if(on){l.hidden=false; if(anim&&!RM){l.classList.add('out');requestAnimationFrame(()=>requestAnimationFrame(()=>l.classList.remove('out')))}} else l.hidden=true});
    $$('.osp-shot-item').forEach(s=>s.hidden=s.dataset.k!==k);
  }
  tabs.forEach((b,i)=>{
    b.addEventListener('click',()=>show(b.dataset.k,true));
    b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const o=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];o.focus();show(o.dataset.k,true)}});
  });
})();
/* ---------------- centres: world map ---------------- */
(function(){
  const SC=SITE.centres||[]; if(!$('#map'))return;
  const T={diploma:'d',training:'t',robotics:'r'};
  /* same projection as the land shapes in _includes/home/world-map-paths.svg */
  const proj=d3.geoNaturalEarth1().scale(181.31274511867957).translate([500,301.7702943942111]);
  const C=SC.map(c=>[c.name,c.city,c.country,T[c.type]||'d',c.lat,c.lng,c.url]);
  const XY=C.map(c=>proj([c[5],c[4]]).map(v=>+v.toFixed(1)));
  const TYPES={d:'Diploma centre',t:'Training centre',r:'Diploma centre · GESEA Robotics centre'};
  const svgM=$('#map'), gP=$('#pts'), tip=$('#mapTip'), borders=$('#borders');
  let type='all', view='world';
  const WORLD=[0,0,1000,530];
  const EU=(()=>{const ids=XY.map((p,i)=>i).filter(i=>C[i][4]>28&&C[i][5]>-15&&C[i][5]<45);
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; ids.forEach(i=>{const[x,y]=XY[i];x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)});
    const pad=26; x0-=pad;y0-=pad;x1+=pad;y1+=pad; let w=x1-x0,h=y1-y0; const ar=1000/530;
    if(w/h<ar){const nw=h*ar;x0-=(nw-w)/2;w=nw}else{const nh=w/ar;y0-=(nh-h)/2;h=nh} return [x0,y0,w,h]})();
  let vb=WORLD.slice();
  const typeOk=c=> type==='all' || (type==='diploma'&&(c[3]==='d'||c[3]==='r')) || (type==='training'&&c[3]==='t');
  const P=C.map((c,i)=>{
    const [x,y]=XY[i];
    const g=el('g',{class:'pt '+({d:'diploma',t:'training',r:'robot'}[c[3]]),transform:`translate(${x} ${y})`,tabindex:0,role:'button','data-i':i,'aria-label':`${c[0]}, ${c[1]}, ${c[2]}`},gP);
    const h=el('circle',{class:'h'},g), d=el('circle',{class:'c'},g), t=el('text',{y:0},g); t.textContent=c[1];
    g.addEventListener('mouseenter',()=>hl(i)); g.addEventListener('focus',()=>hl(i)); g.addEventListener('click',()=>hl(i,true));
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hl(i,true)}});
    return {g,h,d,t};
  });
  function sizes(){
    const k=vb[2]/1000; // 1 at world view, smaller when zoomed
    P.forEach(p=>{p.d.setAttribute('r',5*k+ (k<1?0:0));p.d.setAttribute('stroke-width',1.4*k);p.h.setAttribute('r',13*k);p.t.setAttribute('font-size',13*k);p.t.setAttribute('x',9*k);p.t.setAttribute('y',4*k);p.t.setAttribute('stroke-width',3*k)});
    borders.setAttribute('stroke-width',.7*k);
  }
  function apply(){svgM.setAttribute('viewBox',vb.map(v=>v.toFixed(2)).join(' '));sizes()}
  let anim=null;
  function zoomTo(target){
    cancelAnimationFrame(anim); const from=vb.slice(); const t0=performance.now(); const D=RM?1:1400;
    const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    const tick=now=>{const t=Math.min(1,(now-t0)/D);const e=ease(t);vb=from.map((v,i)=>v+(target[i]-v)*e);apply();if(t<1)anim=requestAnimationFrame(tick)};
    anim=requestAnimationFrame(tick);
  }
  function filter(){P.forEach((p,i)=>{const ok=typeOk(C[i]);p.g.classList.toggle('hide',!ok);p.g.setAttribute('tabindex',ok?0:-1)})}
  function hl(i,scroll){
    P.forEach((p,k)=>p.g.classList.toggle('hl',k===i));
    $$('#clist a').forEach(a=>a.classList.toggle('hl',+a.dataset.i===i));
    const c=C[i];
    tip.innerHTML=`<span><b>${c[0]}</b><br>${c[1]}, ${c[2]} · ${TYPES[c[3]]}</span><a class="tlink" href="${c[6]}">View centre <span class="ar">→</span></a>`;
    if(scroll){const a=$(`#clist a[data-i="${i}"]`);if(a){const l=$('#clist');if(l.scrollHeight>l.clientHeight)l.scrollTo({top:a.offsetTop-l.offsetTop-40,behavior:'smooth'})}}
  }
  function list(){
    const byC={};C.forEach((c,i)=>{if(!typeOk(c))return;(byC[c[2]]=byC[c[2]]||[]).push([c,i])});
    $('#clist').innerHTML=Object.keys(byC).map(k=>`<h4>${k.toUpperCase()}</h4>`+byC[k].map(([c,i])=>`<a href="${c[6]}" data-i="${i}">${c[0]}<span>${c[1]}</span></a>`).join('')).join('');
    $$('#clist a').forEach(a=>{a.addEventListener('mouseenter',()=>hl(+a.dataset.i));a.addEventListener('focus',()=>hl(+a.dataset.i))});
  }
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;$$('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));zoomTo(view==='eu'?EU:WORLD)}));
  $$('[data-type]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.type;$$('[data-type]').forEach(x=>x.setAttribute('aria-pressed',x===b));filter();list()}));
  apply();filter();list();
})();

/* ---------------- globe ---------------- */
function startGlobe(){
  const cv=$('#globe'); if(!window.d3||!cv)return;
  const ctx=cv.getContext('2d'); const pts=(SITE.centres||[]).map(c=>[c.lng,c.lat,c.type==='training'?'t':'d']);
  let LAND={type:'FeatureCollection',features:[]};
  fetch(SITE.base+'/assets/data/land-110m.geojson').then(r=>r.json()).then(j=>{LAND=j}).catch(()=>{});
  const proj=d3.geoOrthographic().clipAngle(90).precision(.4);
  const path=d3.geoPath(proj,ctx); const grat=d3.geoGraticule10();
  let W=0,dpr=1;
  function size(){const r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;cv.width=W*dpr;cv.height=W*dpr;proj.translate([W/2,W/2]).scale(W/2-2)}
  size(); window.addEventListener('resize',size);
  let lam=-20, t0=performance.now(), running=true;
  function frame(now){
    if(!running)return;
    const dt=Math.min(64,now-t0); t0=now; if(!RM) lam+=dt*0.004;
    proj.rotate([lam,-22,0]);
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,W);
    const g=ctx.createRadialGradient(W*.38,W*.32,W*.05,W/2,W/2,W/2);g.addColorStop(0,'#FFFFFF');g.addColorStop(1,'#EEF6FD');
    ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=g;ctx.fill();
    ctx.lineWidth=1;ctx.strokeStyle='rgba(0,88,162,.10)';ctx.stroke();
    ctx.beginPath();path(grat);ctx.strokeStyle='rgba(0,88,162,.06)';ctx.lineWidth=.8;ctx.stroke();
    ctx.beginPath();path(LAND);ctx.fillStyle='#DDECF8';ctx.fill();
    const c=proj.rotate(); const centre=[-c[0],-c[1]];
    const pulse=(Math.sin(now/600)+1)/2;
    pts.forEach(([lon,lat,ty])=>{
      if(d3.geoDistance([lon,lat],centre)>Math.PI/2-.05)return;
      const [x,y]=proj([lon,lat]);
      ctx.beginPath();ctx.arc(x,y,4+pulse*6,0,Math.PI*2);ctx.fillStyle=`rgba(0,153,255,${.22*(1-pulse)+.05})`;ctx.fill();
      ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=ty==='t'?'#0099FF':'#0058A2';ctx.fill();
      ctx.lineWidth=1.2;ctx.strokeStyle='#fff';ctx.stroke();
    });
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(es=>{const v=es[0].isIntersecting; if(v&&!running){running=true;t0=performance.now();requestAnimationFrame(frame)} else if(!v) running=false},{threshold:0}).observe(cv);
  requestAnimationFrame(frame);
  cv.classList.add('on');
}

/* ---------------- intro: GESEA first, then the page ---------------- */
(function(){
  const intro=$('#intro');
  let seen=false; try{seen=sessionStorage.getItem('geseaIntro')==='1'}catch(e){}
  function revealPage(){
    if(G) gsap.to('.hero .fade',{y:0,opacity:1,duration:1.4,ease:'power2.out',stagger:.12});
    else $$('.hero .fade').forEach(e=>{e.style.opacity=1;e.style.transform='none'});
    setTimeout(()=>window.__heroDraw&&window.__heroDraw(),RM?0:350);
    startGlobe();
  }
  if(!G||seen){ document.documentElement.classList.add('no-intro'); revealPage(); return; }
  try{sessionStorage.setItem('geseaIntro','1')}catch(e){}
  if(lenis) lenis.stop(); document.documentElement.style.overflow='hidden';
  const tl=gsap.timeline({onComplete:finish});
  tl.from('#introLogo .p1, #introLogo .p2, #introLogo .p3',{scale:.4,opacity:0,transformOrigin:'50% 50%',duration:1,ease:'power3.out',stagger:.16})
    .from('#introLogo .wd',{clipPath:'inset(0 100% 0 0)',duration:1.1,ease:'power2.inOut'},'-=.35')
    .from('#introLogo .sb',{opacity:0,y:10,duration:.8,ease:'power2.out'},'-=.3')
    .to({},{duration:.5})
    .add(()=>{ // fly logo to the nav
      const a=$('#introLogo').getBoundingClientRect(), b=$('#navLogo').getBoundingClientRect();
      gsap.to('#introLogo',{x:(b.left+b.width/2)-(a.left+a.width/2),y:(b.top+b.height/2)-(a.top+a.height/2),scale:b.width/a.width,duration:1.1,ease:'power3.inOut'});
      gsap.to('#intro .skip',{opacity:0,duration:.4});
      gsap.to(intro,{backgroundColor:'rgba(255,255,255,0)',duration:1,delay:.35,ease:'power2.out'});
    })
    .to({},{duration:1.15});
  gsap.set('#navLogo',{opacity:0});
  function finish(){
    gsap.set('#navLogo',{opacity:1}); intro.remove();
    document.documentElement.style.overflow=''; if(lenis) lenis.start();
    revealPage();
  }
  intro.addEventListener('click',()=>{tl.kill();gsap.killTweensOf('#introLogo');finish()},{once:true});
})();

if(G){
  window.addEventListener('load',()=>ScrollTrigger.refresh());
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>ScrollTrigger.refresh());
}
})();
