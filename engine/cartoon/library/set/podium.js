// a speaker's podium with a small microphone on a stage.
ZS.define("podium", {"about": "a speaker's podium with a small microphone on a stage", "kind": "set", "tags": ["inside", "school", "office"], "aliases": ["lectern", "speech stand", "stage podium", "speaker stand", "মঞ্চ", "পোডিয়াম"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#8a5f40","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const acc=o.color2||k.pick(r,["#2f6fb0","#d8452f","#1f7a4d"]);
  k.ground(s,76,3);
  P("M-30 -76 L30 -76 L24 -3 L-24 -3Z",c);P("M-30 -76 L-14 -76 L-12 -3 L-24 -3Z",light(c,.12));
  R(-34,-82,68,6,dark(c,.22),2);R(-34,-82,68,2,light(c,.2),1);R(-28,-4,56,4,dark(c,.25),1.5);
  R(-17,-62,34,21,acc,2);R(-13,-54,26,2.2,"#fbf6e9",1);R(-9,-49,18,1.6,"#fbf6e9",.8);C(0,-58.5,1.6,"#fbf6e9");
  P("M4 -82 L5.4 -82 C7 -90 10 -94 14 -96 L13 -97.6 C8 -95.6 5 -91 4 -82Z","#3a3f4b");E(15,-98,3,2.3,"#2a2d36");
  return g;
});
