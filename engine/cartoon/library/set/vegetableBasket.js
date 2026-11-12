// vegetable basket.
ZS.define("vegetableBasket", {"about": "vegetable basket", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c0ad7b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  P("M-55 -42 L55 -42 L43 0 L-43 0Z",c);for(let i=0;i<11;i++)P(`M${-50+i*10} -40 L${-40+i*8} -2 l2 0 L${-48+i*10} -40Z`,light(c,.2));for(let i=0;i<12;i++){const xx=-43+r()*86,yy=-43-r()*18;E(xx,yy,8,12,k.pick(r,["#98ad7c","#b8bf8e","#c5966d"]));}R(-55,-43,110,5,dark(c,.12),2);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
