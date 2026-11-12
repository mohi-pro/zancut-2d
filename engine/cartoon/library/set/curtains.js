// curtains (wall-mounted; anchor is bottom centre).
ZS.define("curtains", {"about": "curtains (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bca68b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-63,-100,126,3,"#a5a58d",1);for(const s of [-1,1]){const panel=G(),edge=o.open?s*43:s*4;P(`M${s*58} -96 L${s*2} -96 Q${edge} -43 ${edge} -4 L${s*58} 0Z`,c,1,panel);for(let i=0;i<4;i++)P(`M${s*(12+i*12)} -94 Q${s*(25+i*9)} -43 ${s*(42+i*5)} -4 l2 0 Q${s*(25+i*9)+2} -43 ${s*(12+i*12)+2} -94Z`,dark(c,.08),1,panel);anim.push(t=>panel.setAttribute("transform",`rotate(${Math.sin(t*.7+phase+s)*.5} ${s*55} -96)`));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
