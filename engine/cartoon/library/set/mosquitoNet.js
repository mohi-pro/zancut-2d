// Translucent mosquito net only; bottom centre ground anchor. Place over a separate bed..
ZS.define("mosquitoNet", {"about": "Translucent mosquito net only; bottom centre ground anchor. Place over a separate bed.", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b7c8bb","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-70,-100,2,100,"#b5ac90");R(68,-100,2,100,"#b5ac90");P("M-70 -94 Q0 -110 70 -94 L82 0 Q0 -10 -82 0Z",c,.32);for(let i=0;i<13;i++)R(-70+i*12,-93,1,88,c,.5);for(let j=0;j<10;j++)R(-74,-88+j*9,148,1,c);P("M0 -95 Q-10 -50 -3 -5 L3 -5 Q9 -50 0 -95Z",dark(c,.1),.4);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
