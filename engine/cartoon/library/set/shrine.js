// shrine.
ZS.define("shrine", {"about": "shrine", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#dfd4b9","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-48,-62,96,62,c,3);R(27,-62,21,62,dark(c,.1));R(-54,-5,108,5,light(c,.12),1);P("M-32 -63 Q-38 -84 0 -98 Q38 -84 32 -63Z",o.color2||"#7d9d86");R(-2,-100,3,8,"#b7a16b");for(const xx of [-34,-8,18]){P(`M${xx} -7 L${xx} -33 Q${xx+9} -50 ${xx+18} -33 L${xx+18} -7Z`,o.lit?"#ead199":"#64808a");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
