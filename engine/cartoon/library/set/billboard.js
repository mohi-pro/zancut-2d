// billboard.
ZS.define("billboard", {"about": "billboard", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c8bc9c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  k.ground(s,90,3.2);
  R(-32,-58,6,58,"#929a86",1);R(26,-58,6,58,"#929a86",1);R(-76,-100,152,61,c,3);R(-72,-96,144,53,light(c,.22),2);label(o.text,0,-65,10,"#5b6d60");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
