// launch.
ZS.define("launch", {"about": "launch", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#6c8d90","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const hull=G();P("M-110 -31 L110 -31 L84 -3 L-81 -3Z",c,1,hull);R(-72,-64,147,33,"#e9dfc7",3,hull);R(-49,-89,110,25,"#e9dfc7",3,hull);R(-50,-93,115,5,dark(c,.1),1,hull);for(let j=0;j<2;j++)for(let i=0;i<8;i++)R(-63+i*18+j*12,-57-j*25,10,12,o.lit?"#e5ce8c":"#7ca5b0",2,hull);anim.push(t=>hull.setAttribute("transform",`translate(0 ${Math.sin(t*.8+phase)*1.1}) rotate(${Math.sin(t*.65+phase)*.65})`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
