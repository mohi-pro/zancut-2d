// a cork notice board on a wall with pinned papers and sticky notes (wall-mounted; anchor is bottom centre).
ZS.define("noticeBoard", {"about": "a cork notice board on a wall with pinned papers and sticky notes (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside", "office", "school"], "aliases": ["notice board", "bulletin board", "cork board", "pin board", "sticky notes board", "নোটিশ বোর্ড"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#b98a55","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=150,fr=dark(c,.28),ink="#8b95a0",notes=["#f4d76b","#f2a48c","#a7d8c0","#a9c8ec"];
  R(-w/2,-100,w,100,fr,3);R(-w/2+5,-95,w-10,90,c,1);R(-w/2+5,-95,w-10,3,light(c,.18),1);
  for(let i=0;i<26;i++)C(-w/2+10+r()*(w-20),-90+r()*80,.8+r()*.7,dark(c,.16),.7);
  const cols=4,cw=(w-16)/cols;
  for(let i=0;i<cols;i++)for(let j=0;j<2;j++){
    if(r()<.14)continue;
    const paper=r()<.55,pw=paper?cw*.76:cw*.58,ph=paper?34:cw*.58,px=-w/2+8+i*cw+(cw-pw)/2+(r()-.5)*5,py=-91+j*43+(r()-.5)*5,tilt=(r()-.5)*7;
    const n=k.el("g",{transform:`rotate(${tilt} ${px+pw/2} ${py})`},s),f=paper?"#fbf6e9":k.pick(r,notes);
    R(px+1,py+1.4,pw,ph,"#1c1420",0,n).setAttribute("opacity",.16);R(px,py,pw,ph,f,0,n);
    const ls=paper?5:3;for(let l=0;l<ls;l++)R(px+3,py+6+l*(ph-9)/ls,(pw-6)*(.55+r()*.45),1.3,paper?ink:dark(f,.34),.5,n);
    C(px+pw/2,py+1.6,1.9,k.pick(r,["#d8452f","#2d7f8c","#e0a02c"]),1,n);
  }
  return g;
});
