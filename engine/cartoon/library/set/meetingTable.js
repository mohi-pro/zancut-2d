// a long meeting table seen from the front at table height, room for three people behind it.
ZS.define("meetingTable", {"about": "a long meeting table seen from the front at table height, room for three people behind it", "kind": "set", "tags": ["inside", "office"], "aliases": ["conference table", "boardroom table", "interview table", "meeting desk", "long table", "মিটিং টেবিল"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#9a7a5a","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=320;
  k.ground(s,w*.86,4);
  R(-w/2,-100,w,11,c,3);R(-w/2,-100,w,3.2,light(c,.24),2);R(-w/2+3,-90,w-6,2.4,dark(c,.25),1);
  const lg=dark(c,.16);R(-w/2+16,-88,9,88,lg,1);R(w/2-25,-88,9,88,lg,1);
  R(-w/2+25,-88,w-50,38,dark(c,.1),1);R(-w/2+25,-88,w-50,4,dark(c,.28),1);
  for(let i=0;i<3;i++)R(-w/2+25+(w-50)*(i+.5)/3-.6,-84,1.2,34,dark(c,.2));
  R(-w/2+13,-3,15,3,dark(c,.28),1);R(w/2-28,-3,15,3,dark(c,.28),1);
  return g;
});
