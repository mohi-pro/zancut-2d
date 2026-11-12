// fire truck.
ZS.define("fireTruck", {"about": "fire truck", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#ba6c58","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  const beacon=(x,y)=>{R(x-14,y,28,5,"#a5b5a0",2);const a=R(x-13,y-3,12,6,"#c47b69",2),b=R(x+1,y-3,12,6,"#88aeba",2);anim.push(t=>{a.setAttribute("opacity",.45+.55*Math.pow(Math.cos(t*5),2));b.setAttribute("opacity",.45+.55*Math.pow(Math.sin(t*5),2));});};
  k.ground(s,90,3.2);
  const ww=230;R(-ww/2,-75,ww*.66,50,c,3);P(`M${ww*.16} -25 L${ww*.16} -86 L${ww*.36} -86 L${ww/2} -55 L${ww/2} -25Z`,o.color2||light(c,.14));P(`M${ww*.21} -79 L${ww*.34} -79 L${ww*.44} -57 L${ww*.21} -57Z`,"#8eafb4");for(let j=0;j<3;j++){R(-ww*.46+j*43,-63,38,31,"#c6c5b5",2);for(let i=0;i<5;i++)R(-ww*.44+j*43,-58+i*5,29,1,"#a4a99a");}R(-ww*.47,-90,ww*.67,4,"#c9cbbb",1);R(-ww*.47,-80,ww*.67,3,"#c9cbbb",1);for(let i=0;i<12;i++)R(-ww*.45+i*12,-90,2,12,"#c9cbbb");beacon(ww*.25,-93);R(-ww/2,-25,ww,7,dark(c,.22),1);R(ww/2-12,-43,10,7,"#e9dbaf",2);wheel(-ww*.31,-16,16);wheel(ww*.31,-16,16);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
