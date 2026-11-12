// shower (wall-mounted; anchor is bottom centre).
ZS.define("shower", {"about": "shower (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a8beaa","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  P("M-34 0 L-34 -87 Q-34 -100 -20 -100 L19 -100 L19 -95 L-19 -95 Q-29 -95 -29 -86 L-29 0Z",c);E(19,-91,17,6,c);if(o.on)for(let i=0;i<7;i++){const drop=R(6+i*4,-82-r()*5,1,42,"#acc9bf",1);anim.push(t=>drop.setAttribute("opacity",.2+.5*(.5+.5*Math.sin(t*4+i))));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
