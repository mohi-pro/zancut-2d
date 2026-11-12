// a salon or barber chair on a round foot, seen from the side.
ZS.define("salonChair", {"about": "a salon or barber chair on a round foot, seen from the side", "kind": "set", "tags": ["inside", "shop", "salon"], "aliases": ["barber chair", "hair salon chair", "parlour chair", "saloon chair", "সেলুন চেয়ার"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#3a3f4b","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const steel="#b6bdc4",pad=c;
  k.ground(s,88,3);
  E(0,-2.6,34,2.7,steel);E(0,-3.4,31,1.5,light(steel,.4));R(-5,-34,10,31,steel,1.5);R(-5,-34,3,31,light(steel,.4),1);
  P("M-30 -46 C-30 -40 -28 -36 -22 -35 L30 -35 C36 -35 37 -42 34 -47 L-24 -50 C-28 -50 -30 -49 -30 -46Z",pad);
  P("M-29 -47 C-30 -49 -29 -50 -24 -50 L34 -47 L34 -44.6Z",light(pad,.2));
  P("M-42 -92 C-46 -94 -48 -92 -47 -88 L-33 -44 L-20 -47 L-31 -89 C-33 -92 -38 -91 -42 -92Z",pad);
  P("M-42 -92 C-46 -94 -48 -92 -47 -88 L-33 -44 L-30 -45 L-43 -90Z",light(pad,.18));
  R(-45,-100,15,9,dark(pad,.1),4);R(-39,-92,4,4,steel,1);
  R(-24,-64,52,4.5,dark(pad,.18),2);R(20,-62,3.5,20,steel,1);
  P("M31 -38 L44 -12 L39 -9 L27 -36Z",dark(pad,.1));R(36,-13,22,4,steel,1.5);
  return g;
});
