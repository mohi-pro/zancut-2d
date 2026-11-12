// tea stall.
ZS.define("teaStall", {"about": "tea stall", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#8b9d91","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const steam=(x,y)=>{for(let i=0;i<3;i++){const puff=E(x-5+i*5,y-i*7,4+i,5+i,"#c9cebb",.35);anim.push(t=>{puff.setAttribute("transform",`translate(${Math.sin(t+i+phase)*2} ${-((t*7+i*5)%18+18)%18})`);puff.setAttribute("opacity",.12+.18*(.5+.5*Math.sin(t+i+phase)));});}};
  k.ground(s,90,3.2);
  const ww=132;R(-ww*.46,-86,4,86,"#9c8c6c",1);R(ww*.43,-86,4,86,"#9c8c6c",1);P(`M${-ww*.54} -81 L${-ww*.4} -100 L${ww*.4} -100 L${ww*.54} -81Z`,c);R(-ww*.54,-83,ww*1.08,5,dark(c,.12),1);R(-58,-79,115,41,"#ad9b79",1);R(-62,-35,124,35,"#b99065",2);R(-65,-39,130,6,"#d0b58a",2);for(let i=0;i<3;i++){R(-49+i*19,-65,13,25,"#c6ccb1",3);R(-49+i*19,-64,13,4,"#929e8a",1);for(let j=0;j<4;j++)C(-45+i*19+r()*4,-46-r()*11,2,"#b79863");}E(32,-46,12,10,"#9aa693");P("M40 -51 L52 -57 L47 -45 L40 -42Z","#9aa693");R(26,-58,12,4,"#7b8777",2);R(-65,-15,48,5,"#96734e",1);R(-61,-10,3,10,"#96734e");R(-23,-10,3,10,"#96734e");steam(30,-65);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
