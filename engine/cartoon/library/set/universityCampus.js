// university campus.
ZS.define("universityCampus", {"about": "university campus", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c9baa0","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  k.ground(s,90,3.2);
  const ww=190; R(-ww/2,-90,ww,85,c,2);R(ww*.32,-90,ww*.18,85,dark(c,.12));R(-ww*.53,-94,ww*1.06,5,light(c,.18),1);for(let j=0;j<2;j++)for(let i=0;i<5;i++){if(j==1&&i==2)continue;R(-ww*.43+i*ww*.18,-82+j*25,ww*.12,15,o.lit&&((i+j)%3!==1)?"#ead5a0":"#90afb6",1);R(-ww*.44+i*ww*.18,-66+j*25,ww*.14,2,light(c,.15),1);}R(-14,-31,28,26,"#78959b",2);R(-1,-30,2,25,"#c6c9b5");for(let i=0;i<3;i++)R(-27-i*7,-7+i*2,54+i*14,3,"#b4b5a4",1);P(`M${-ww*.47} -73 L0 -98 L${ww*.47} -73Z`,light(c,.14));for(const xx of [-ww*.37,-ww*.21,ww*.17,ww*.33]){R(xx,-70,6,62,"#ded6bd",1);R(xx-2,-13,10,4,"#e4dcc4",1);}R(-ww*.47,-74,ww*.94,6,"#ded6bd",1);R(-32,-46,64,10,light(c,.19),1);label(o.text,0,-39,6,"#5b6961");for(const xx of [-116,116]){R(xx,-35,5,35,"#8e7351",1);E(xx,-40,18,22,"#829b71");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
