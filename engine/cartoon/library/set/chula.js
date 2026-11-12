// chula.
ZS.define("chula", {"about": "chula", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bb8864","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const steam=(x,y)=>{for(let i=0;i<3;i++){const puff=E(x-5+i*5,y-i*7,4+i,5+i,"#c9cebb",.35);anim.push(t=>{puff.setAttribute("transform",`translate(${Math.sin(t+i+phase)*2} ${-((t*7+i*5)%18+18)%18})`);puff.setAttribute("opacity",.12+.18*(.5+.5*Math.sin(t+i+phase)));});}};
  k.ground(s,90,3.2);
  E(0,-6,41,9,dark(c,.12));P("M-40 -7 L-30 -47 Q0 -57 30 -47 L40 -7Z",c);P("M-15 -8 L-15 -24 Q0 -40 15 -24 L15 -8Z","#635044");P("M-9 -8 Q-15 -21 -3 -28 Q0 -18 6 -23 Q17 -8 -9 -8Z","#d9a15e");E(0,-48,27,7,"#595a54");R(-23,-69,46,22,"#6b726d",8);E(0,-70,23,6,"#92958a");R(-5,-79,10,5,"#626963",2);steam(0,-83);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
