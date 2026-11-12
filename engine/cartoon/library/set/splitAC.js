// split a c (wall-mounted; anchor is bottom centre).
ZS.define("splitAC", {"about": "split a c (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d3d8c1","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-82,-95,164,61,c,9);R(-76,-48,152,10,dark(c,.14),2);for(let i=0;i<3;i++)R(-71,-46+i*3,142,1,"#a2b39d");R(-66,-86,112,2,light(c,.2),1);C(64,-48,2,o.on===false?"#a9b49e":"#8bad86");if(o.on!==false)for(let i=0;i<3;i++){const air=P(`M${-50+i*40} -29 q-7 15 0 28 l2 0 q-7 -13 0 -28Z`,"#b8d3c5",.45);anim.push(t=>air.setAttribute("opacity",.2+.3*(.5+.5*Math.sin(t*2+i+phase))));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
