// blackboard (wall-mounted; anchor is bottom centre).
ZS.define("blackboard", {"about": "blackboard (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#617d6d","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  R(-75,-100,150,89,"#b1956d",3);R(-70,-95,140,79,c,1);R(-78,-14,156,5,"#b99b70",1);label(o.text,0,-55,10,"#e3e2c9");R(42,-18,12,3,"#e5dfc4",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
