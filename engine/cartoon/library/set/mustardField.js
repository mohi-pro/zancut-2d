// mustard field.
ZS.define("mustardField", {"about": "mustard field", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#7d9b5d","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const w=o.w?o.w/h*100:220;P(`M${-w/2} 0 L${-w*.38} -70 Q0 -100 ${w*.4} -70 L${w/2} 0Z`,dark(c,.13));for(let j=0;j<4;j++){const yy=-12-j*18;for(let i=0;i<14;i++){const px=-w*.43+i*w*.066+(j%2)*4;const col=c;P(`M${px} ${yy} l-4 -17 l5 10 l3 -22 l2 22 l4 -12 l-3 19Z`,col);C(px+3,yy-23,2.8,"#e6c35b");C(px-3,yy-16,2.2,"#efce65");}}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
