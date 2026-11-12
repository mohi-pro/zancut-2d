// coconut palm.
ZS.define("coconutPalm", {"about": "coconut palm", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#648c52","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,50,3.2);
  const lean=10+r()*10;P(`M-5 0 Q6 -45 ${lean-3} -85 L${lean+3} -85 Q16 -40 5 0Z`,"#9c8355");
const leaves=G();for(let i=0;i<7;i++){const a=(i-3)*.43,dx=Math.sin(a)*58,dy=-Math.cos(a)*21;P(`M${lean} -83 Q${lean+dx*.5} ${-103+dy} ${lean+dx} ${-76+dy} Q${lean+dx*.4} ${-85+dy} ${lean} -83Z`,i%2?c:light(c,.15),1,leaves);}
for(let i=0;i<3;i++)C(lean-5+i*5,-81,4,"#8f7749");
anim.push(t=>leaves.setAttribute("transform",`rotate(${Math.sin(t*.8+phase)*1.4} ${lean} -83)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
