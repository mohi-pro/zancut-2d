// market street.
ZS.define("marketStreet", {"about": "market street", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#8b9d91","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  k.ground(s,90,3.2);
  for(let j=0;j<3;j++){const px=-105+j*72;R(px,-75,69,75,j===0?c:k.pick(r,k.WALLS),1);R(px+5,-51,59,51,"#71877b",1);for(let i=0;i<7;i++)R(px+5+i*8,-51,1,50,"#96a590");R(px,-72,69,13,"#dfd0ad",1);label(Array.isArray(o.text)?o.text[j]:o.text,px+34,-62,6,"#5a6c60");for(let i=0;i<6;i++)R(px+i*11.5,-57,11.5,9,i%2?"#c29a75":"#dec6a0",1);}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
