// door (wall-mounted; anchor is bottom centre).
ZS.define("door", {"about": "door (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b99e78","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-32,-100,64,100,dark(c,.15),2);R(-27,-95,54,95,"#586e64",1);const ww=o.open?19:50;P(`M-25 -93 L${-25+ww} ${o.open?-83:-93} L${-25+ww} ${o.open?9:0} L-25 0Z`,c);R(-20,-85,ww-8,32,light(c,.1),1);R(-20,-43,ww-8,34,light(c,.06),1);C(-29+ww,-47,2,"#d4c293");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
