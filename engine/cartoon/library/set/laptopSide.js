// an open laptop on a table seen from the side, the lid's back and the keyboard's edge show; flip turns it the other way (anchor is the table top under its middle).
ZS.define("laptopSide", {"about": "an open laptop on a table seen from the side, the lid's back and the keyboard's edge show; flip turns it the other way (anchor is the table top under its middle)", "kind": "set", "tags": ["inside", "office", "school", "work"], "aliases": ["laptop from the side", "side view laptop", "open laptop on a table", "ল্যাপটপ পাশ থেকে"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#aeb6bd","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const glow=o.glow??"#bcd8f0";
  k.ground(s,104,1.8);
  const b0=dark(c,.14);P("M-48 -7 L54 -7 L56 0 L-50 0Z",b0);P("M-48 -7 L54 -7 L54.8 -5 L-48.6 -5Z",light(c,.3));R(-50,-1,106,1,dark(c,.4));
  R(30,-3.2,10,1.3,dark(c,.45),.6);C(-44,-3,1,"#6fd08c");
  P("M-46 -7 L-30 -7 L-66 -100 L-82 -94Z",dark(c,.12));P("M-30 -7 L-27 -7 L-63 -100 L-66 -100Z",glow);P("M-46 -7 L-42 -7 L-78 -95.5 L-82 -94Z",light(c,.16));
  P("M-27 -7 L54 -7 L34 -34 L-40 -40Z",glow,.14);
  C(-55.5,-50,4.4,light(c,.42),.9);
  return g;
});
