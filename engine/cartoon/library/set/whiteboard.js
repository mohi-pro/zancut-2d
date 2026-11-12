// lines ok
// a white marker board in a thin metal frame with a tray and a marker (wall-mounted; anchor is bottom centre).
ZS.define("whiteboard", {"about": "a white marker board in a thin metal frame with a tray and a marker (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside", "office", "school"], "aliases": ["white board", "marker board", "board in a meeting room", "হোয়াইটবোর্ড"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#b9c0c4","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=170,ink=["#2f6fb0","#d8452f","#2d7f8c"];
  R(-w/2,-100,w,92,c,2);R(-w/2+3,-97,w-6,86,"#fbfcfa",1);R(-w/2+3,-97,w-6,4,"#eef1ee",1);
  P(`M${-w/2+3} -11 L${-w/2+58} -97 L${-w/2+84} -97 L${-w/2+29} -11Z`,"#eef2f0",.8);
  const mark=k.pick(r,ink),box=(a,b,bw,bh)=>{const q=k.el("rect",{x:a,y:b,width:bw,height:bh,rx:2,fill:"none",stroke:mark,"stroke-width":1.3},s);return q;};
  const line=(a,b,len,col=mark)=>R(a,b,len,1.3,col,.6);
  const kind=Math.floor(r()*3);
  if(kind===0){for(let i=0;i<5;i++)line(-66,-84+i*13,60+r()*64);line(-66,-84,48,k.pick(r,ink));C(-73,-83,1.7,mark);}
  else if(kind===1){box(-68,-80,38,24);box(-14,-80,38,24);box(38,-54,32,24);line(-30,-68,16);P("M26 -68 L38 -68 L38 -56 L36 -56 L36 -66 L26 -66Z",mark);for(let i=0;i<3;i++)line(-62,-46+i*8,44+r()*30);}
  else{const bars=[18,30,24,42,52];bars.forEach((b,i)=>R(-62+i*17,-28-b,11,b,i===4?"#d8452f":mark,1));line(-68,-27,104);for(let i=0;i<3;i++)line(44,-80+i*11,26);}
  R(-w/2+6,-9,w-12,4,dark(c,.2),1);R(-w/2+6,-9,w-12,1.3,light(c,.25),.5);
  R(26,-12,17,3,"#2f6fb0",1.2);R(26,-12,5,3,"#1c1420",1.2);R(48,-11.6,12,2.6,"#d8452f",1.2);
  return g;
});
