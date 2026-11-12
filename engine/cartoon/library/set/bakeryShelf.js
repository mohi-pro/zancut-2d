// a bakery display shelf with loaves, buns and cakes on three levels.
ZS.define("bakeryShelf", {"about": "a bakery display shelf with loaves, buns and cakes on three levels", "kind": "set", "tags": ["inside", "shop", "food"], "aliases": ["bread shelf", "bakery display", "bakery rack", "cake shelf", "pastry shelf", "বেকারি"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed);
  const c=o.color||k.mix("#a9805a","#e8dcc1",r()*.10);
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{},root);
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const dark=k.dark,light=k.light;
  const w=120,bread="#d39a55",crust="#b4733a",cake=["#f2c4cf","#f3e3bd","#8a5a3c"];
  k.ground(s,w*.95,3.2);
  R(-w/2,-100,w,100,dark(c,.12),2);R(-w/2+4,-96,w-8,92,dark(c,.42),1);R(-w/2,-100,w,4,c,1);R(-w/2,-100,4,100,c,1);R(w/2-4,-100,4,100,c,1);R(-w/2,-4,w,4,c,1);
  const levels=[-66,-36,-4];
  levels.forEach((yy,j)=>{
    if(j<2){R(-w/2+4,yy,w-8,3.5,c);R(-w/2+4,yy,w-8,1,light(c,.25));}
    const n=j===0?4:j===1?3:5,gap=(w-14)/n;
    for(let i=0;i<n;i++){const cx=-w/2+7+gap*(i+.5),t=r();
      if(j===1){const h2=12+t*4,w2=gap*.72,col=k.pick(r,cake);R(cx-w2/2,yy-h2,w2,h2,col,2);R(cx-w2/2,yy-h2,w2,3,light(col,.4),1.5);C(cx,yy-h2-1.5,1.8,"#d8452f");}
      else if(j===0){E(cx,yy-6.5,gap*.42,6.5,bread);E(cx-1,yy-8.5,gap*.3,3,light(bread,.3));}
      else{const lw=gap*.84;R(cx-lw/2,yy-13,lw,13,bread,5);R(cx-lw/2,yy-13,lw,4,crust,3);for(let q=0;q<2;q++)R(cx-lw/4+q*lw/4,yy-13,1.2,6,light(bread,.3),.5);}
    }
  });
  return g;
});
