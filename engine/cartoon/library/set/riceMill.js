// rice mill.
ZS.define("riceMill", {"about": "rice mill", "kind": "set", "tags": ["village", "bangladesh", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a5b4a5","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const ww=130+r()*15;R(-ww/2,-65,ww,60,c,2);R(ww*.25,-65,ww*.25,60,dark(c,.13));R(-ww*.54,-7,ww*1.08,7,"#b29a77",2);P(`M${-ww*.59} -65 L${-ww*.34} -100 L${ww*.4} -100 L${ww*.6} -65Z`,o.roof||"#80979a");for(let i=0;i<18;i++){const px=-ww*.48+i*ww*.056;P(`M${-ww*.58+i*ww*.069} -66 L${-ww*.34+i*ww*.0435} -99 l1 0 L${-ww*.58+i*ww*.069+1} -66Z`,"#a4b1ac",.65);R(-ww*.48+i*ww*.054,-61,1,51,dark(c,.09));}R(-12,-45,24,40,"#594d40",1);if(!o.open)R(-11,-44,22,39,dark(c,.35),1);for(const xx of [-45,31]){R(xx,-49,19,21,"#695c49",1);R(xx+2,-47,15,17,o.lit?"#efd99e":"#95b8bd");R(xx+9,-47,1,17,"#746d58");}R(43,-90,14,61,"#9c9789");P("M43 -90 L50 -99 L57 -90Z","#b2ad9d");for(let i=0;i<3;i++){E(47+i*11,-8,8,12,"#d4bd88");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
