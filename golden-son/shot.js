// Test shot: boots slam onto the Bellona table -> tilt up to Darrow's smile -> drop to Cassius -> swing around his face.
const fs=require('fs');const {chromium}=require('playwright');const R=require('./rig.js');
const S='/tmp/claude-0/-home-user-hello-world/11b4d0c0-d0a2-51de-abd4-676ba9875b91/scratchpad';
const font=n=>`data:font/woff2;base64,${fs.readFileSync(S+'/fonts/'+n).toString('base64')}`;
const FPS=30, DUR=8.4, N=Math.round(FPS*DUR);
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)), io=u=>{u=cl(u);return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;}, eo=u=>1-Math.pow(1-cl(u),3);
const kf=(t,ks)=>{ if(t<=ks[0][0])return ks[0][1]; for(let i=1;i<ks.length;i++){ if(t<=ks[i][0]){const [t0,v0]=ks[i-1],[t1,v1]=ks[i];return v0+(v1-v0)*io((t-t0)/(t1-t0));} } return ks[ks.length-1][1]; };
const TY=1500; // table top (world y)
const DX=400, CX=830; // Darrow / Cassius world x
const LAND=0.55;

function bg(t, par){ // far hall, moves less than the camera (parallax)
  let o=`<rect x="-2000" y="-1500" width="6000" height="5000" fill="#141a2e"/>`;
  for(let i=-3;i<8;i++){ const x=i*330+par; o+=`<rect x="${x}" y="-600" width="150" height="2300" fill="#1d2744"/><path d="M${x+20} 300 q55 -70 110 0 v700 h-110z" fill="#f2c56b" opacity=".55"/><path d="M${x+20} 300 q55 -70 110 0 v700 h-110z" fill="none" stroke="#0e1324" stroke-width="10"/>`; }
  for(let i=-2;i<6;i++){ const x=i*330+165+par*1.15; o+=`<path d="M${x} -200 h130 v520 l-65 -70 l-65 70z" fill="#2c4f86" stroke="#0e1324" stroke-width="8"/>${R.eagle(x+65,40,170)}`; }
  for(let i=0;i<26;i++){ const x=((i*197)%2600)-700+par*1.3, y=380+((i*131)%700), r=14+(i%4)*8; o+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd98a" opacity="${(0.10+0.08*Math.sin(t*2+i)).toFixed(3)}"/>`; }
  return o+`<rect x="-2000" y="1100" width="6000" height="2400" fill="#0f1426"/>`;
}
function guests(par){ let o=''; const cols=['#2c4f86','#3a62a0','#24406e']; [[-150,1560,250],[1250,1570,260],[1560,1540,240],[-480,1550,240]].forEach(([x,y,s],i)=>{ o+=`<g opacity=".75" transform="translate(${par*0.5} 0)">${R.character(x,y,s,{fill:cols[i%3],trim:'#dfe6ee',hairCol:['#d9b25a','#b98a3a','#e6cf8a','#8a6a3a'][i],hair:'curls',yaw:i%2?25:-25,brow:'angry',mouth:'frown'})}</g>`; }); return o; }
function table(t){
  const j = t>LAND ? Math.exp(-(t-LAND)*7)*Math.sin((t-LAND)*38) : 0; // dishes jump on impact
  let o=`<path d="M-900 ${TY} H2300 V${TY+900} H-900Z" fill="#2c4f86" stroke="#0e1324" stroke-width="10"/><rect x="-900" y="${TY}" width="3200" height="34" fill="#dfe6ee" stroke="#0e1324" stroke-width="6"/>
    <path d="M-900 ${TY+34} H2300 V${TY+70} H-900Z" fill="#1f3b68"/>${R.eagle(DX+40,TY+330,620,'#3a62a0')}`;
  const plate=(x,k)=>`<g transform="translate(${x} ${TY-8-Math.abs(j)*k})  rotate(${j*k*0.12})"><ellipse rx="92" ry="16" fill="#eef1f5" stroke="#0e1324" stroke-width="6"/><ellipse rx="58" ry="9" fill="#cfd6df"/></g>`;
  const goblet=(x,k,spill)=>`<g transform="translate(${x} ${TY-Math.abs(j)*k}) rotate(${spill? cl((t-LAND)*6)*78 : j*k*0.2})"><path d="M-26 -120 h52 l-8 62 h-12 v40 h22 v14 h-56 v-14 h22 v-40 h-12z" fill="#e2a93b" stroke="#0e1324" stroke-width="6" stroke-linejoin="round"/><rect x="-20" y="-112" width="40" height="14" fill="#7a1512"/></g>`;
  o+=plate(60,60)+plate(700,45)+plate(1120,30)+goblet(190,50,false)+goblet(630,40,true)+goblet(1010,25,false);
  if(t>LAND){ const u=cl((t-LAND)*1.6); o+=`<path d="M650 ${TY-6} q${90*u} -10 ${170*u} 4 q${-40*u} 18 ${-170*u} 8z" fill="#8f1d16" stroke="#0e1324" stroke-width="5"/>`; }
  return o;
}
function impact(t){ if(t<LAND||t>LAND+0.5) return ''; const u=(t-LAND)/0.5; let o='';
  for(let i=0;i<12;i++){ const a=(-170+i*15)*Math.PI/180, r0=120+260*eo(u), r1=r0+90*(1-u); o+=`<line x1="${DX+Math.cos(a)*r0}" y1="${TY-10+Math.sin(a)*r0*0.35}" x2="${DX+Math.cos(a)*r1}" y2="${TY-10+Math.sin(a)*r1*0.35}" stroke="#fff" stroke-width="${10*(1-u)}" stroke-linecap="round" opacity="${1-u}"/>`; }
  return o+`<ellipse cx="${DX}" cy="${TY-4}" rx="${200+500*eo(u)}" ry="${22+50*eo(u)}" fill="none" stroke="#fff" stroke-width="${8*(1-u)}" opacity="${0.8*(1-u)}"/>`; }

function frame(t){
  // camera: [cx, cy, zoom]
  const cx=kf(t,[[0,DX],[1.5,DX],[2.6,DX-10],[3.9,DX-10],[4.9,CX],[8.4,CX+20]]);
  const cy=kf(t,[[0,1440],[1.5,1440],[2.6,790],[3.9,800],[4.9,1175],[8.4,1165]]);
  const z =kf(t,[[0,1.75],[1.5,1.75],[2.6,1.9],[3.9,2.0],[4.9,2.15],[8.4,2.3]]);
  const shake = t>LAND&&t<LAND+0.45 ? Math.exp(-(t-LAND)*9)*26 : 0, sx=shake*Math.sin(t*90), sy=shake*Math.cos(t*77);
  const dYaw=kf(t,[[0,0],[2.2,-22],[3.9,16]]), cYaw=kf(t,[[0,-30],[4.6,-42],[6.4,6],[8.4,36]]);
  // Darrow drop + squash
  const fall = t<LAND ? -1500*Math.pow(1-t/LAND,2) : 0;
  const sq = t>LAND ? 1-0.09*Math.exp(-(t-LAND)*10)*Math.cos((t-LAND)*30) : 1.04;
  const par = -(cx-DX)*0.45 - cYaw*2.2; // background slides opposite to the swing
  const cam=`translate(${540+sx} ${880+sy}) scale(${z}) translate(${-cx} ${-cy})`;
  const cMood = t>5.6 ? {brow:'angry',mouth:'frown'} : {brow:'soft',mouth:'flat'};
  const cBlink = (t>5.45&&t<5.6);
  const world = bg(t,par)+guests(par)
    + R.cassius(CX, TY+255, 300, {yaw:cYaw, ...cMood, blink:cBlink})
    + table(t)
    + `<g transform="translate(0 ${fall}) translate(${DX} ${TY}) scale(${2-sq} ${sq}) translate(${-DX} ${-TY})">${R.darrow(DX, TY, 330, {yaw:dYaw, mouth: t>2.5?'grin':'smirk', brow:'angry'})}</g>`
    + impact(t);
  const fgx = -(cx-DX)*0.6 - cYaw*4;
  const fg = `<g filter="url(#blur)" opacity=".9"><path d="M${-260+fgx} 1920 v-520 q60 -90 120 0 v520z" fill="#0b0f1c"/><path d="M${1180+fgx} 1920 v-400 q90 -120 180 0 v400z" fill="#0b0f1c"/></g>`;
  const cap = t<1.6 ? ['THE BELLONA WANTED HIM DEAD.', t>0.55?'SO HE STOOD ON THEIR TABLE.':''] : t<4.6 ? ['DARROW.', t>2.7?'SMILING.':''] : ['CASSIUS AU BELLONA.', t>5.6?'JULIAN\'S BROTHER.':''];
  return `<svg viewBox="0 0 1080 1920" width="1080" height="1920"><defs><filter id="blur"><feGaussianBlur stdDeviation="14"/></filter></defs><g transform="${cam}">${world}</g>${fg}</svg>
    <div class="vig"></div><div class="cap"><div class="l1">${cap[0]}</div>${cap[1]?`<div class="l2">${cap[1]}</div>`:''}</div>`;
}
(async()=>{
  const out=__dirname+'/frames'; fs.mkdirSync(out,{recursive:true});
  const W=parseInt(process.argv[2]||'0'), K=parseInt(process.argv[3]||'1');
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.setContent(`<style>@font-face{font-family:Anton;src:url(${font('font2.woff2')})}html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#0f1426}#w{position:absolute;inset:0}svg{position:absolute;inset:0}
   .vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.55) 100%)}
   .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.5)}.l1{color:#f6ead2}.l2{color:#e8372c}</style><div id="w"></div>`);
  await p.evaluate(()=>document.fonts.ready);
  for(let f=W;f<N;f+=K){ const html=frame(f/FPS); await p.evaluate(h=>{document.getElementById('w').innerHTML=h;},html); await p.screenshot({path:`${out}/f${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:90}); }
  await b.close();
})();
