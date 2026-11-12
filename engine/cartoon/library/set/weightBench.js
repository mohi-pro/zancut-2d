// a gym weight bench with a barbell on its rack, seen from the side.
ZS.define("weightBench", {"about": "a gym weight bench with a barbell on its rack, seen from the side", "kind": "set", "tags": ["inside", "gym", "sport"], "aliases": ["bench press", "gym bench", "barbell", "weights", "gym equipment", "জিম"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#3b4250","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const steel="#8b95a0",plate="#2a2d36",pad=o.color2||k.pick(r,["#d8452f","#2f6fb0","#2d7f8c"]);
  k.ground(s,190,3.4);
  R(-92,-45,132,10,pad,4);R(-92,-45,132,3,light(pad,.25),2);R(-80,-35,110,5,c,1);
  R(-74,-32,7,32,c,1);R(16,-32,7,32,c,1);R(-88,-4,36,4,c,1.5);R(2,-4,36,4,c,1.5);
  R(32,-100,7,100,c,1);R(32,-100,2,100,light(c,.2),1);R(20,-4,36,4,c,1.5);P("M28 -92 L46 -92 L46 -84 L32 -84Z",dark(c,.2));
  C(42,-90,7,dark(c,.25));C(42,-90,2.2,steel);
  R(30,-92.6,24,1.2,steel);R(46,-104,4,28,plate,1);R(51,-100,3.6,20,dark(plate,.1),1);
  return g;
});
