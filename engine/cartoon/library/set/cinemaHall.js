// cinema hall.
ZS.define("cinemaHall", {"about": "cinema hall", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c6a48e","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  k.ground(s,90,3.2);
  const ww=125; R(-ww/2,-90,ww,85,c,2);R(ww*.32,-90,ww*.18,85,dark(c,.12));R(-ww*.53,-94,ww*1.06,5,light(c,.18),1);R(-50,-82,100,42,"#7d8a8a",2);R(-46,-78,40,34,"#b9a37b",1);P("M-42 -48 L-29 -70 L-11 -48Z","#d4bd8e");C(23,-62,13,"#bbc1ad");R(-61,-39,122,12,"#ab7e67",2);label(o.text,0,-30,7,"#f2e4c6");R(-14,-31,28,26,"#78959b",2);R(-1,-30,2,25,"#c6c9b5");for(let i=0;i<3;i++)R(-27-i*7,-7+i*2,54+i*14,3,"#b4b5a4",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
