// construction site.
ZS.define("constructionSite", {"about": "construction site", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a9976b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-60,-86,118,86,"#bba88a",2);for(let j=0;j<3;j++)for(let i=0;i<3;i++)R(-48+i*35,-74+j*25,22,17,"#7c8272",1);for(let i=0;i<5;i++)R(-69+i*34,-100,2,100,c,1);for(let j=0;j<5;j++)R(-72,-94+j*21,142,2,c,1);for(let i=0;i<4;i++)P(`M${-69+i*34} 0 l34 -94 l2 0 l-34 94Z`,c);for(let j=0;j<3;j++)for(let i=0;i<4-j;i++)R(67+i*12+j*6,-5-j*6,11,5,"#bb8969",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
