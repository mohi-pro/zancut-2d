// wall clock (wall-mounted; anchor is bottom centre).
ZS.define("wallClock", {"about": "wall clock (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b4a37f","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  C(0,-50,49,c);C(0,-50,43,"#e8dfc4");for(let i=0;i<12;i++){const a=i*Math.PI/6;C(Math.sin(a)*36,-50-Math.cos(a)*36,1.5,"#7a8b77");}const minute=R(-1,-82,2,32,"#758773",1),hour=R(-2,-72,4,22,"#657a69",2);C(0,-50,4,"#879a80");anim.push(t=>{minute.setAttribute("transform",`rotate(${(o.hours||10)*0+(o.minutes||10)*6+t*.1} 0 -50)`);hour.setAttribute("transform",`rotate(${(o.hours||10)*30+(o.minutes||10)*.5+t/120} 0 -50)`);});
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
