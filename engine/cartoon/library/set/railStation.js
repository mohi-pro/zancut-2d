// rail station.
ZS.define("railStation", {"about": "rail station", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#8b9d91","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const label=(txt,x,y,size,col)=>{if(txt!==undefined&&txt!==null&&String(txt).length){const e=k.el("text",{x,y,fill:col,"text-anchor":"middle","font-size":size,"font-family":"'Hind Siliguri', sans-serif"},s);e.textContent=String(txt);}};
  k.ground(s,90,3.2);
  const ww=210;R(-ww*.46,-86,4,86,"#9c8c6c",1);R(ww*.43,-86,4,86,"#9c8c6c",1);P(`M${-ww*.54} -81 L${-ww*.4} -100 L${ww*.4} -100 L${ww*.54} -81Z`,c);R(-ww*.54,-83,ww*1.08,5,dark(c,.12),1);R(-ww*.35,-31,ww*.7,7,"#a18b65",2);for(const xx of [-ww*.3,ww*.3])R(xx,-25,4,25,"#8a8f7e",1);R(-32,-78,64,15,"#e0d3b3",1);label(o.text,0,-68,7,"#5f7166");R(-ww*.56,-6,ww*1.12,6,"#a2a899",1);R(-ww*.56,-10,ww*1.12,4,"#d3c9a7",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
