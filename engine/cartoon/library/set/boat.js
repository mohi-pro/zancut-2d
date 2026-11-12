// boat.
ZS.define("boat", {"about": "boat", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#8b6748","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const hull=G();P("M-93 -36 Q-46 -13 83 -39 Q53 0 -28 -6 Q-64 -12 -93 -36Z",c,1,hull);P("M-77 -31 Q-7 -18 73 -35 Q26 -10 -53 -22Z",light(c,.25),1,hull);for(let i=0;i<8;i++)R(-48+i*13,-26,2,9,dark(c,.2),1,hull);if(o.sail!==false){R(4,-100,3,77,"#8c7250",1,hull);P("M4 -96 Q-25 -69 -48 -47 L4 -43Z",o.color2||"#e5d4ae",1,hull);}anim.push(t=>hull.setAttribute("transform",`translate(0 ${Math.sin(t*.8+phase)*1.1}) rotate(${Math.sin(t*.65+phase)*.65})`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
