// Ceiling fan; anchor at ceiling, drawn downward. h scales the fan, blades rotate when on..
ZS.define("ceilingFan", {"about": "Ceiling fan; anchor at ceiling, drawn downward. h scales the fan, blades rotate when on.", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a8b6a4","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-2,0,4,50,"#939d8a",1);const rotor=G();for(let i=0;i<3;i++){const blade=P("M0 48 Q12 36 43 43 Q47 48 42 53 L5 54Z",c,1,rotor);blade.setAttribute("transform",`rotate(${i*120} 0 50)`);}C(0,50,8,dark(c,.1));C(-2,48,5,light(c,.15));if(o.on!==false)anim.push(t=>rotor.setAttribute("transform",`rotate(${t*350} 0 50)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
