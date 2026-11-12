// a tall steel warehouse rack with four levels of boxes and sacks.
ZS.define("metalRack", {"about": "a tall steel warehouse rack with four levels of boxes and sacks", "kind": "set", "tags": ["inside", "work", "warehouse"], "aliases": ["warehouse rack", "storage rack", "steel shelf", "metal shelf", "store room rack", "garage shelf", "তাক", "র‍্যাক"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#5e6b78","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=112,box=["#c79a63","#b58a58","#d3ad78","#8b95a0"],sack="#d8cfb8";
  k.ground(s,w*1.02,3);
  R(-w/2,-100,4,100,c,1);R(w/2-4,-100,4,100,c,1);R(-w/2+11,-100,2.6,100,dark(c,.25));R(w/2-13.6,-100,2.6,100,dark(c,.25));
  [-96,-66,-36,-7].forEach((yy,j)=>{
    R(-w/2,yy,w,4,"#d97b2d",.8);R(-w/2,yy,w,1,light("#d97b2d",.3),.4);
    if(j===0)return;
    let cx=-w/2+6;
    while(cx<w/2-16){const bw=14+r()*16,bh=12+r()*12,t=r();
      if(t<.14){cx+=bw*.7;continue;}
      if(t<.3)P(`M${cx} ${yy} C${cx} ${yy-bh} ${cx+bw} ${yy-bh} ${cx+bw} ${yy}Z`,sack);
      else{const f=k.pick(r,box);R(cx,yy-bh,bw,bh,f,1);R(cx+bw*.42,yy-bh,bw*.16,bh,light(f,.3));R(cx,yy-bh,bw,1.6,light(f,.2));}
      cx+=bw+2;}
  });
  return g;
});
