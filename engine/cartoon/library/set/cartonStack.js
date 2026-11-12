// a stack of taped cardboard cartons.
ZS.define("cartonStack", {"about": "a stack of taped cardboard cartons", "kind": "set", "tags": ["inside", "work", "warehouse"], "aliases": ["cardboard boxes", "stack of boxes", "cartons", "packing boxes", "parcel stack", "কার্টন", "বাক্স"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#c79a63","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const box=(a,b,bw,bh)=>{const f=k.mix(c,"#a87a48",r()*.5);R(a,b,bw,bh,f,1);R(a,b,bw,2.4,light(f,.22),1);R(a+bw*.44,b,bw*.12,bh,light(f,.38));R(a+bw-3,b,3,bh,dark(f,.14));
    R(a+5,b+bh*.62,bw*.26,bh*.2,"#fbf6e9",.6);R(a+6.5,b+bh*.68,bw*.17,1,"#8b95a0",.4);};
  const w0=118;k.ground(s,w0*1.02,3);
  const a=46+r()*6;box(-w0/2,-a,w0*.54,a);box(w0*.05,-a*.92,w0*.45,a*.92);
  const up=-a,b=30+r()*10;box(-w0*.42,up-b,w0*.46,b);
  box(-w0*.34,up-b-Math.max(14,100-a-b),w0*.34,Math.max(14,100-a-b));
  box(w0*.08,-a*.92-26,w0*.34,26);
  return g;
});
