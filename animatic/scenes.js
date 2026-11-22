// Scene definitions for the Red Rising animatic. Each beat: bg, l1, l2 (twist line), art (SVG/HTML), start/pop cue phrases.
const C = { red:'#c8312b', gold:'#e2a93b', obs:'#2b2b33', gray:'#8a8f98', pink:'#e58aa6', blue:'#3b6fd1', purple:'#6a3fb5', cream:'#f3e6c8', ink:'#1b1410' };

function badge(x, y, r, fill, glyph, label, opts={}) {
  const ring = opts.ring || '#f3e6c8';
  const x0 = opts.x ? `<g stroke="#fff" stroke-width="${r*0.14}" stroke-linecap="round"><line x1="${x-r*0.75}" y1="${y-r*0.75}" x2="${x+r*0.75}" y2="${y+r*0.75}"/><line x1="${x+r*0.75}" y1="${y-r*0.75}" x2="${x-r*0.75}" y2="${y+r*0.75}"/></g>` : '';
  return `<g ${opts.glow?'filter="url(#glow)"':''} opacity="${opts.op??1}">
    <circle cx="${x}" cy="${y}" r="${r+r*0.12}" fill="${ring}"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>
    <text x="${x}" y="${y+r*0.36}" font-size="${r*1.05}" text-anchor="middle" fill="#fff" font-family="Anton">${glyph}</text>
    ${x0}
    ${label?`<text x="${x}" y="${y+r*1.75}" font-size="${Math.max(30,r*0.42)}" text-anchor="middle" fill="${opts.lc||'#f3e6c8'}" font-family="Cinzel" font-weight="700">${label}</text>`:''}
  </g>`;
}

// Simple chibi: big round head, small body.
function chibi(x, y, s, body, opts={}) {
  const skin = opts.skin || '#f0d2b0';
  const eyes = opts.eyes || '#1b1410';
  const face = opts.half ? `<path d="M${x} ${y-s*1.95} a${s*0.62} ${s*0.62} 0 0 1 0 ${s*1.24} z" fill="${opts.half}"/>` : '';
  return `<g opacity="${opts.op??1}">
    <path d="M${x-s*0.55} ${y} L${x-s*0.4} ${y-s*1.0} L${x+s*0.4} ${y-s*1.0} L${x+s*0.55} ${y} Z" fill="${body}" stroke="#000" stroke-width="${s*0.05}"/>
    <circle cx="${x}" cy="${y-s*1.33}" r="${s*0.62}" fill="${skin}" stroke="#000" stroke-width="${s*0.05}"/>
    ${face}
    ${opts.hair?`<path d="M${x-s*0.62} ${y-s*1.4} a${s*0.62} ${s*0.62} 0 0 1 ${s*1.24} 0 q${-s*0.62} ${-s*0.25} ${-s*1.24} 0z" fill="${opts.hair}"/>`:''}
    <circle cx="${x-s*0.22}" cy="${y-s*1.3}" r="${s*0.07}" fill="${opts.eyeL||eyes}"/>
    <circle cx="${x+s*0.22}" cy="${y-s*1.3}" r="${s*0.07}" fill="${opts.eyeR||eyes}"/>
    ${opts.sad?`<path d="M${x-s*0.15} ${y-s*1.02} q${s*0.15} ${-s*0.12} ${s*0.3} 0" stroke="#000" stroke-width="${s*0.05}" fill="none"/>`:''}
  </g>`;
}

function crowd(n, x0, y, gap, s, body, opts={}) { let o=''; for (let i=0;i<n;i++) o+=chibi(x0+i*gap, y + (i%2)*s*0.25, s, body, opts); return o; }

function marsMap() {
  let craters=''; const pts=[[300,1050],[700,980],[520,1250],[820,1300],[260,1400],[640,1500],[420,1650]];
  pts.forEach(([x,y],i)=>craters+=`<circle cx="${x}" cy="${y}" r="${30+i*6}" fill="none" stroke="#7a2c17" stroke-width="5" opacity=".6"/>`);
  return `<circle cx="540" cy="1250" r="440" fill="#b4451f"/><circle cx="540" cy="1250" r="440" fill="url(#shade)"/>${craters}
  <g fill="#ffcf6b" filter="url(#glow)">${[[400,1120],[600,1300],[480,1450],[700,1150]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="10"/>`).join('')}</g>`;
}

function pyramid(flip=false) {
  const rows=[['GOLD',C.gold],['SILVER','#bfc4cc'],['WHITE','#eee'],['GRAY',C.gray],['OBSIDIAN',C.obs],['PINK',C.pink],['RED',C.red]];
  let o=''; const top=760, h=140;
  rows.forEach(([n,c],i)=>{ const w=180+i*110; const y=top+i*h; o+=`<rect x="${540-w/2}" y="${y}" width="${w}" height="${h-12}" rx="10" fill="${c}" stroke="#000" stroke-width="4"/><text x="540" y="${y+90}" text-anchor="middle" font-family="Anton" font-size="56" fill="${['WHITE','SILVER'].includes(n)?'#222':'#fff'}">${n}</text>`;});
  return `<g ${flip?'transform="rotate(180 540 1240)"':''}>${o}</g>`;
}

function oddsCard(fill) {
  const rows=[['NUMBERS',.95,.05],['FLEETS',.95,.05],['ALLIES',.85,.15],['SECRETS',.05,.95]];
  let o=`<text x="540" y="560" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#3a2a18">OUR ESTIMATES</text>`;
  o+=badge(300,760,110,C.gold,'Ψ','THE SOCIETY',{lc:'#2a1d12'})+badge(780,760,110,C.red,'D','DARROW',{lc:'#2a1d12'});
  rows.forEach(([n,a,b],i)=>{ const y=1060+i*190; o+=`<text x="540" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#2a1d12">${n}</text>`;
    const wa = fill? 400*a : 4, wb = fill? 400*b : 4;
    o+=`<rect x="${530-wa}" y="${y+25}" width="${wa}" height="44" fill="${C.gold}"/><rect x="550" y="${y+25}" width="${wb}" height="44" fill="${C.red}"/>`;
    if(fill && n==='SECRETS') o+=`<text x="540" y="${y+130}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="36" fill="#8f1d16">THE ONLY ROW THAT MATTERS</text>`; });
  return o;
}

function gallows(x,y,rope=true,body=''){ return `<g stroke="#2a1d16" stroke-width="22" fill="none" stroke-linecap="round"><path d="M${x-160} ${y} H${x+160} M${x-100} ${y} V${y-700} H${x+120}"/></g>${rope?`<line x1="${x+120}" y1="${y-700}" x2="${x+120}" y2="${y-480}" stroke="#c9a46a" stroke-width="8"/>`:''}${body}`; }

function stars(n=60){ let o=''; for(let i=0;i<n;i++){ const x=(i*137.5)%1080, y=500+((i*251)%1400); o+=`<circle cx="${x}" cy="${y}" r="${1.5+(i%3)}" fill="#fff" opacity="${.3+(i%5)/8}"/>`;} return o; }

function houseMap(route=false, flag=false) {
  let o=`<rect x="60" y="640" width="960" height="1000" rx="20" fill="#d9bf86" stroke="#6d5330" stroke-width="6"/>`;
  for(let i=0;i<40;i++){ const x=110+(i*173)%860, y=700+(i*97)%880; o+=`<path d="M${x} ${y+40} l30 -50 l30 50z" fill="#8b6b3f" opacity=".7"/>`;}
  const flags=[[200,760],[480,720],[800,780],[300,1000],[620,950],[880,1060],[180,1280],[460,1240],[760,1300],[260,1520],[560,1500],[860,1540]];
  flags.forEach(([x,y],i)=>o+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${y-70}" stroke="#222" stroke-width="5"/><rect x="${x}" y="${y-70}" width="50" height="34" fill="${i===4?C.red:'#2a2a2a'}"/>`);
  o+=`<g transform="translate(540 1150)"><circle r="70" fill="#f3e6c8" stroke="#6d5330" stroke-width="6"/><text y="14" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="30" fill="#6d5330">OLYMPUS</text></g>`;
  if(route) o+=`<path d="M620 950 C 700 1050, 640 1100, 590 1110" stroke="${C.red}" stroke-width="12" fill="none" stroke-dasharray="26 16"/>`+badge(700,820,46,C.gold,'Ψ','',{})+badge(380,880,46,C.gold,'Ψ','',{});
  if(flag) o+=`<line x1="540" y1="1080" x2="540" y2="940" stroke="#222" stroke-width="8"/><path d="M540 940 h120 l-30 35 l30 35 h-120z" fill="${C.red}"/>`;
  return o;
}

const BEATS = [
 {bg:'dark', l1:'HE WAS BORN A SLAVE.', l2:'TO FREE THEM, HE BECAME THEIR MASTER.', start:'he was born', pop:'to free',
  art:()=>chibi(540,1500,330,C.red,{half:C.gold, eyeR:C.gold})+`<text x="540" y="1680" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#f3e6c8">DARROW</text>`},
 {bg:'space', l1:'MARS. THE FAR FUTURE.', start:'mars the far', art:()=>marsMap()+`<text x="540" y="1780" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="52" fill="#f3e6c8">THE SOCIETY</text>`},
 {bg:'dark', l1:'SOCIETY RUNS ON COLOR.', l2:'GOLD ON TOP. RED AT THE BOTTOM.', start:'humanity is', pop:'golds rule', art:()=>pyramid()},
 {bg:'dark', l1:'DARROW. 16. HELLDIVER.', l2:'BEST MINER ON MARS.', start:'darrow is sixteen', pop:'the best',
  art:()=>`<rect x="0" y="1150" width="1080" height="770" fill="#3a1d12"/><path d="M0 1150 Q540 1080 1080 1150" fill="#3a1d12"/>`+chibi(540,1560,240,C.red,{hair:'#7a1f14'})+`<path d="M700 1420 l200 -60 l20 40 l-200 60z" fill="#777" stroke="#000" stroke-width="5"/>`+badge(540,860,90,C.red,'D','HELLDIVER OF LYKOS')},
 {bg:'dark', l1:'THE REDS THOUGHT THEY WERE SAVING MARS.', start:'the reds believe',
  art:()=>`<rect x="0" y="980" width="1080" height="940" fill="#3a1d12"/>`+crowd(5,180,1650,180,150,C.red,{hair:'#7a1f14'})+`<rect x="190" y="760" width="700" height="80" rx="40" fill="#222" stroke="#f3e6c8" stroke-width="5"/><rect x="200" y="770" width="20" height="60" rx="10" fill="${C.red}"/><text x="540" y="740" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#f3e6c8">TERRAFORMING PROGRESS</text><text x="540" y="920" text-anchor="middle" font-family="Anton" font-size="60" fill="${C.red}">0.4%</text>`},
 {bg:'space', l1:'', l2:'THE CITIES WERE ALREADY BUILT.', start:'they aren\'t',
  art:()=>{ let o=''; for(let i=0;i<9;i++){ const h=200+((i*71)%300); o+=`<rect x="${70+i*105}" y="${1260-h}" width="80" height="${h}" fill="${C.gold}" stroke="#7a5a10" stroke-width="5"/>`; for(let k=0;k<h/60;k++) o+=`<rect x="${90+i*105}" y="${1280-h+k*60}" width="40" height="20" fill="#fff7d0"/>`;}
   return o+`<rect x="0" y="1260" width="1080" height="660" fill="#3a1d12"/>`+crowd(4,240,1700,200,120,C.red,{hair:'#7a1f14'})+`<text x="540" y="860" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#fff">THE SURFACE</text><text x="540" y="1860" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#f3e6c8">THE REDS BELOW</text>`;}},
 {bg:'dark', l1:'HIS WIFE SANG ONE FORBIDDEN SONG.', start:'his wife eo',
  art:()=>`<path d="M540 520 L260 1750 H820 Z" fill="#fff6d6" opacity=".12"/>`+chibi(540,1600,280,C.red,{hair:'#9b2a1a'})+`<text x="760" y="1050" font-size="140" fill="${C.gold}">♪</text><text x="540" y="1760" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#f3e6c8">EO</text>`},
 {bg:'blood', l1:'', l2:'THEY HANGED HER FOR IT.', start:'and they hang her', art:()=>gallows(480,1700)+`<g opacity=".85">${chibi(600,1560,150,'#1a0606',{skin:'#2a0b0b',eyes:'#2a0b0b'})}</g>`},
 {bg:'dark', l1:'THEY HANGED HIM TOO.', l2:'HE DIDN\'T DIE.', start:'then they hang darrow', pop:'he wakes',
  art:()=>gallows(400,1700,false)+`<line x1="520" y1="1000" x2="520" y2="1080" stroke="#c9a46a" stroke-width="8"/><line x1="520" y1="1110" x2="520" y2="1180" stroke="#c9a46a" stroke-width="8"/>`+chibi(560,1640,190,C.red,{hair:'#7a1f14'})+chibi(820,1660,150,'#222')+chibi(300,1680,150,'#222')},
 {bg:'dark', l1:'THE REBELS HAD ONE PLAN.', start:'the rebels',
  art:()=>`<g transform="translate(540 1200)"><g stroke="${C.gold}" stroke-width="14">${Array.from({length:16},(_,i)=>`<line x1="0" y1="0" x2="${Math.cos(i*Math.PI/8)*380}" y2="${Math.sin(i*Math.PI/8)*380}"/>`).join('')}</g><circle r="200" fill="#1b1410" stroke="${C.gold}" stroke-width="14"/><path d="M-120 40 Q-120 -150 0 -150 Q120 -150 120 40 L60 40 L40 100 H-40 L-60 40Z" fill="${C.gold}"/></g><text x="540" y="1720" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="56" fill="#f3e6c8">SONS OF ARES</text>`},
 {bg:'dark', l1:'', l2:'TURN HIM INTO A GOLD.', start:'turn him into', l2color:'gold',
  art:()=>badge(300,1200,170,C.red,'D','RED')+`<text x="540" y="1250" text-anchor="middle" font-family="Anton" font-size="140" fill="#f3e6c8">→</text>`+badge(780,1200,170,C.gold,'D','GOLD',{glow:true})},
 {bg:'dark', l1:'THEY REBUILT HIS BODY.', l2:'BONE BY BONE.', start:'they rebuild', pop:'bone by bone',
  art:()=>`<rect x="190" y="700" width="700" height="1050" rx="30" fill="#0f2633" stroke="#5ec8ff" stroke-width="6"/><g stroke="#cfefff" stroke-width="16" stroke-linecap="round" fill="none"><circle cx="540" cy="880" r="90"/><line x1="540" y1="970" x2="540" y2="1350"/>${[0,1,2,3,4].map(i=>`<path d="M440 ${1040+i*55} Q540 ${1010+i*55} 640 ${1040+i*55}"/>`).join('')}<line x1="540" y1="1060" x2="380" y2="1250"/><line x1="540" y1="1060" x2="700" y2="1250"/><line x1="540" y1="1350" x2="440" y2="1680"/><line x1="540" y1="1350" x2="640" y2="1680"/></g><g stroke="${C.red}" stroke-width="8">${[[420,1500],[660,1150],[470,1180]].map(([x,y])=>`<line x1="${x-25}" y1="${y-25}" x2="${x+25}" y2="${y+25}"/><line x1="${x+25}" y1="${y-25}" x2="${x-25}" y2="${y+25}"/>`).join('')}</g>`},
 {bg:'parch', l1:'THE INSTITUTE.', l2:'WHERE GOLDS LEARN TO RULE.', start:'he enters', pop:'where young', art:()=>houseMap()},
 {bg:'parch', l1:'FIRST TEST:', l2:'KILL A CLASSMATE.', start:'the first test', pop:'kill a classmate',
  art:()=>`<ellipse cx="540" cy="1500" rx="420" ry="140" fill="#8b6b3f"/>`+chibi(380,1520,220,C.gold,{hair:'#d9a92e'})+chibi(700,1520,220,C.gold,{hair:'#3b2a1a'})+`<line x1="540" y1="1150" x2="540" y2="900" stroke="#ccc" stroke-width="14"/><rect x="500" y="1150" width="80" height="18" fill="#6d5330"/><text x="380" y="1640" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#1b1410">DARROW</text><text x="700" y="1640" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#1b1410">JULIAN</text>`},
 {bg:'parch', l1:'HE KILLED JULIAN.', l2:'JULIAN\'S BROTHER WOULD REMEMBER.', start:'he kills julian', pop:'julian\'s brother',
  art:()=>badge(320,1150,150,C.gold,'J','JULIAN',{x:true,lc:'#1b1410'})+badge(760,1150,150,C.gold,'C','CASSIUS',{glow:true,lc:'#1b1410'})},
 {bg:'parch', l1:'12 HOUSES. ONE WAR GAME.', l2:'THE JUDGES CHEATED.', start:'twelve houses', pop:'the judges', art:()=>houseMap(true)},
 {bg:'parch', l1:'', l2:'HE WON ANYWAY.', start:'he wins anyway', art:()=>houseMap(true,true)},
 {bg:'parch', l1:'HE CUT OFF THE JACKAL\'S HAND.', start:'he takes the jackal\'s',
  art:()=>badge(540,1100,180,C.gold,'J','THE JACKAL',{lc:'#1b1410'})+`<g transform="translate(560 1560) rotate(-25)"><rect x="-50" y="-40" width="100" height="120" rx="30" fill="#f0d2b0" stroke="#000" stroke-width="5"/>${[0,1,2,3].map(i=>`<rect x="${-48+i*26}" y="-110" width="20" height="80" rx="10" fill="#f0d2b0" stroke="#000" stroke-width="4"/>`).join('')}</g><path d="M480 1400 l30 40 l-20 30" stroke="${C.red}" stroke-width="10" fill="none"/>`},
 {bg:'dark', l1:'HIS PRIZE:', l2:'SERVE THE MAN WHO HANGED HIS WIFE.', start:'his prize', pop:'he now serves',
  art:()=>`<g opacity=".25">${gallows(800,1700)}</g>`+chibi(620,1700,380,C.gold,{hair:'#bbb'})+chibi(300,1700,160,C.gold,{hair:'#d9a92e'})+`<text x="620" y="1830" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="#f3e6c8">ARCHGOVERNOR AUGUSTUS</text>`},
 {bg:'parch', l1:'THE ODDS', big:true, start:'so what are', art:()=>oddsCard(false), ink:true},
 {bg:'parch', l1:'THE ODDS', big:true, start:'the society has', art:()=>oddsCard(true), ink:true},
 {bg:'dark', l1:'HE ROSE.', l2:'ONE LIE AWAY FROM DEATH.', start:'he rises fast', pop:'one lie',
  art:()=>{ let o=''; for(let i=0;i<6;i++) o+=`<rect x="380" y="${1700-i*170}" width="320" height="20" fill="#6d5330"/>`; return `<line x1="380" y1="1720" x2="380" y2="800" stroke="#6d5330" stroke-width="16"/><line x1="700" y1="1720" x2="700" y2="800" stroke="#6d5330" stroke-width="16"/>`+o+badge(540,870,90,C.gold,'D','')+`<path d="M200 1800 Q260 1500 220 1200" stroke="#aaa" stroke-width="8" fill="none" stroke-dasharray="12 10"/><circle cx="220" cy="1190" r="22" fill="#ffb02e" filter="url(#glow)"/>`;}},
 {bg:'dark', l1:'HE PLANNED A COUP AT A VICTORY FEAST.', start:'he plans a coup',
  art:()=>`<rect x="90" y="1300" width="900" height="70" fill="#6d4a2a" stroke="#000" stroke-width="5"/><rect x="140" y="1370" width="40" height="300" fill="#4a3018"/><rect x="900" y="1370" width="40" height="300" fill="#4a3018"/>`+[200,370,540,710,880].map((x,i)=>chibi(x,1300,130,i===2?C.gold:C.gold,{hair:i===2?'#d9a92e':'#5a4020'})).join('')+[290,630].map(x=>`<g transform="translate(${x} 1335) rotate(-12)"><rect x="-50" y="-6" width="100" height="12" fill="#ccc"/><rect x="-80" y="-10" width="30" height="20" fill="#333"/></g>`).join('')},
 {bg:'black', l1:'', l2:'SOMEONE ALREADY KNEW.', start:'but someone',
  art:()=>`<g filter="url(#glow)"><ellipse cx="420" cy="1200" rx="70" ry="22" fill="${C.gold}"/><ellipse cx="660" cy="1200" rx="70" ry="22" fill="${C.gold}"/><circle cx="420" cy="1200" r="14" fill="#000"/><circle cx="660" cy="1200" r="14" fill="#000"/></g>`},
 {bg:'dark', l1:'THE JACKAL KNEW HE WAS RED.', start:'the jackal knows',
  art:()=>chibi(380,1650,300,C.gold,{hair:'#e8d48a'})+badge(780,1150,120,C.red,'D','RED',{glow:true})},
 {bg:'dark', l1:'', l2:'HIS FRIEND ROQUE SOLD HIM OUT.', start:'his friend roque',
  art:()=>badge(260,1200,130,C.gold,'D','DARROW')+badge(540,1200,130,C.gold,'R','ROQUE')+badge(820,1200,130,C.gold,'J','JACKAL')+`<path d="M540 1000 Q680 880 790 1000" stroke="${C.red}" stroke-width="12" fill="none"/><path d="M790 1000 l-50 -10 l25 45z" fill="${C.red}"/>`},
 {bg:'blood', l1:'THE JACKAL SHOT HIS OWN FATHER.', l2:'AND TOOK MARS.', start:'the jackal kills', pop:'and takes mars',
  art:()=>marsMap()+badge(880,1700,100,C.gold,'A','AUGUSTUS',{x:true})+`<line x1="540" y1="830" x2="540" y2="620" stroke="#222" stroke-width="10"/><rect x="540" y="620" width="170" height="100" fill="${C.gold}"/><text x="625" y="690" text-anchor="middle" font-family="Anton" font-size="60" fill="#000">J</text>`},
 {bg:'black', l1:'DARROW: SEALED IN A STONE TABLE.', l2:'ALONE IN THE DARK.', start:'darrow is sealed', pop:'alone',
  art:()=>`<rect x="140" y="1050" width="800" height="90" fill="#777"/><rect x="180" y="1140" width="720" height="460" fill="#555" stroke="#888" stroke-width="6"/><rect x="230" y="1190" width="620" height="360" fill="#0a0a0a"/>`+chibi(540,1520,150,C.red,{hair:'#7a1f14',sad:true})},
 {bg:'dark', l1:'SEVRO DUG HIM OUT.', start:'until sevro',
  art:()=>`<rect x="180" y="1240" width="720" height="460" fill="#555"/><path d="M180 1240 l200 -80 l120 60 l160 -100 l240 120z" fill="#777"/>`+chibi(540,1600,170,C.red,{hair:'#7a1f14'})+crowd(3,240,1180,300,130,'#555',{hair:'#6b4f2a'})+`<text x="540" y="1830" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#f3e6c8">THE HOWLERS</text>`},
 {bg:'dark', l1:'HE STOPPED HIDING.', l2:'HE TOLD THE SYSTEM HE WAS RED.', start:'he stops hiding', pop:'he tells',
  art:()=>[[120,720],[600,720],[120,1150],[600,1150],[360,1560]].map(([x,y])=>`<rect x="${x}" y="${y}" width="360" height="320" rx="20" fill="#111" stroke="${C.red}" stroke-width="8"/>`+chibi(x+180,y+300,110,C.red,{hair:'#7a1f14'})).join('')},
 {bg:'dark', l1:'THE LOWCOLORS ROSE.', start:'and the low',
  art:()=>crowd(5,140,1450,200,140,C.red,{hair:'#7a1f14'})+crowd(5,180,1700,200,140,C.gray)+crowd(4,240,1220,200,140,C.obs,{skin:'#cfc2b0'})},
 {bg:'dark', l1:'', l2:'RAGNAR FREED THE OBSIDIANS.', start:'ragnar',
  art:()=>chibi(540,1720,420,C.obs,{skin:'#d8ccb8',hair:'#eee'})+`<g stroke="#999" stroke-width="16" fill="none"><circle cx="230" cy="1350" r="40"/><circle cx="160" cy="1400" r="40"/><circle cx="850" cy="1350" r="40"/><circle cx="920" cy="1400" r="40"/></g><text x="540" y="1860" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="44" fill="#f3e6c8">RAGNAR</text>`},
 {bg:'dark', l1:'MUSTANG — THE JACKAL\'S OWN TWIN —', l2:'CHOSE DARROW.', start:'mustang', pop:'chooses',
  art:()=>badge(300,1200,140,C.gold,'J','JACKAL',{op:.5})+badge(780,1200,140,C.red,'D','DARROW')+badge(540,1560,120,C.gold,'M','MUSTANG',{glow:true})+`<path d="M560 1420 Q640 1340 700 1330" stroke="${C.gold}" stroke-width="10" fill="none"/>`},
 {bg:'dark', l1:'EVEN CASSIUS.', l2:'THE BROTHER OF THE BOY HE KILLED.', start:'even cassius', popWith:true,
  art:()=>badge(270,1200,150,C.red,'D','DARROW')+badge(810,1200,150,C.gold,'C','CASSIUS')+`<text x="540" y="1250" text-anchor="middle" font-family="Anton" font-size="120" fill="#f3e6c8">+</text>`},
 {bg:'blood', l1:'THE JACKAL?', l2:'SEVRO ENDED HIM.', start:'the jackal sevro', pop:'sevro ends',
  art:()=>badge(540,1180,200,C.gold,'J','THE JACKAL',{x:true})},
 {bg:'dark', l1:'CENTURIES OF GOLD.', l2:'BROKEN BY A MINER.', start:'centuries', pop:'broken', art:()=>pyramid(true)},
 {bg:'dark', l1:'HE BECAME A GOLD TO DESTROY THE GOLDS.', l2:'NOW HE HAS TO RULE WHAT\'S LEFT.', start:'he became a gold', pop:'now he has',
  art:()=>chibi(540,1560,330,C.red,{half:C.gold, eyeR:C.gold})+`<g fill="#5a3a20">${[[200,1700],[860,1680],[300,1780],[760,1790],[540,1820]].map(([x,y])=>`<path d="M${x-50} ${y} l40 -60 l60 20 l20 50z"/>`).join('')}</g>`},
 {bg:'black', end:true, l1:'WHO WAS THE REAL VILLAIN?', l2:'THE JACKAL OR THE SOCIETY?', start:'END',
  art:()=>badge(300,950,140,C.gold,'J','THE JACKAL')+`<text x="540" y="990" text-anchor="middle" font-family="Anton" font-size="90" fill="#f3e6c8">OR</text>`+badge(780,950,140,C.gold,'Ψ','THE SOCIETY')},
];
if (typeof module !== 'undefined') module.exports = { BEATS };
