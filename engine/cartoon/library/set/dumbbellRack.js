// a three-level gym rack of dumbbells in pairs.
ZS.define("dumbbellRack", {"about": "a three-level gym rack of dumbbells in pairs", "kind": "set", "tags": ["inside", "gym", "sport"], "aliases": ["dumbbells", "dumbbell stand", "gym weights", "gym rack", "ডাম্বেল"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#3b4250","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=150,steel="#a9b1b8",bell=["#2a2d36","#3a3f4b","#2a2d36"],acc=k.pick(r,["#d8452f","#2f6fb0","#e0a02c"]);
  k.ground(s,w*.95,3.2);
  R(-w/2,-100,6,100,c,1);R(w/2-6,-100,6,100,c,1);R(-w/2-5,-4,22,4,dark(c,.2),1.5);R(w/2-17,-4,22,4,dark(c,.2),1.5);
  [-92,-60,-28].forEach((yy,j)=>{
    R(-w/2+4,yy+13,w-8,4,c,1);R(-w/2+4,yy+13,w-8,1.2,light(c,.28),.5);
    const n=4-j,sz=4+j*1.1,gap=(w-22)/n;
    for(let i=0;i<n;i++){const cx=-w/2+11+gap*(i+.5),half=gap*.32;
      R(cx-half+sz,yy+13-sz-.8,2*half-2*sz,1.8,steel,.8);
      R(cx-half,yy+13-sz*2,sz*1.15,sz*2,bell[j],1);R(cx+half-sz*1.15,yy+13-sz*2,sz*1.15,sz*2,bell[j],1);
      R(cx-half+.6,yy+13-sz*2+.8,1,sz*2-1.6,acc,.5);R(cx+half-1.6,yy+13-sz*2+.8,1,sz*2-1.6,acc,.5);}
  });
  return g;
});
