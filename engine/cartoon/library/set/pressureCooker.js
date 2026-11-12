// pressure cooker.
ZS.define("pressureCooker", {"about": "pressure cooker", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b8c3ac","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const steam=(x,y)=>{for(let i=0;i<3;i++){const puff=E(x-5+i*5,y-i*7,4+i,5+i,"#c9cebb",.35);anim.push(t=>{puff.setAttribute("transform",`translate(${Math.sin(t+i+phase)*2} ${-((t*7+i*5)%18+18)%18})`);puff.setAttribute("opacity",.12+.18*(.5+.5*Math.sin(t+i+phase)));});}};
  k.ground(s,90,3.2);
  R(-37,-76,74,67,c,14);E(0,-76,38,9,light(c,.18));R(-54,-71,20,9,"#708578",3);R(34,-71,20,9,"#708578",3);R(-9,-93,18,10,"#708578",3);R(-3,-100,6,8,"#8da08b",2);steam(0,-106);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
