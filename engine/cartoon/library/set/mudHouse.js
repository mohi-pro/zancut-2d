// mud house.
ZS.define("mudHouse", {"about": "mud house", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c3a27c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const ww=130+r()*15;R(-ww/2,-65,ww,60,c,2);R(ww*.25,-65,ww*.25,60,dark(c,.13));R(-ww*.54,-7,ww*1.08,7,"#b29a77",2);P(`M${-ww*.6} -62 Q-45 -98 0 -100 Q45 -98 ${ww*.6} -62Z`,o.roof||"#b89a58");for(let i=0;i<19;i++)R(-ww*.55+i*ww*.058,-68-r()*14,2,8,"#d0b570",1);R(-12,-45,24,40,"#594d40",1);if(!o.open)R(-11,-44,22,39,dark(c,.35),1);for(const xx of [-45,31]){R(xx,-49,19,21,"#695c49",1);R(xx+2,-47,15,17,o.lit?"#efd99e":"#95b8bd");R(xx+9,-47,1,17,"#746d58");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
