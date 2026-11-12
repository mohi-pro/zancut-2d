// Procedural vector actors/creatures/props assembled from validated DNA, driven only by scene time.
// Humanoid primary chains use the existing anatomy/gesture solver; fantasy attachments are checked separately.
(function(root) {
  const el = (...args) => root.ZC.el(...args), P = (x,y) => ({x,y});
  const path = (g,d,fill,extra={}) => el('path',{d,fill,...extra},g);
  const circle = (g,x,y,r,fill,extra={}) => el('circle',{cx:x,cy:y,r,fill,...extra},g);
  const ellipse = (g,x,y,rx,ry,fill,extra={}) => el('ellipse',{cx:x,cy:y,rx,ry,fill,...extra},g);
  const stroke = (g,a,b,width,color,extra={}) => el('path',{d:`M${a.x},${a.y} L${b.x},${b.y}`,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round',...extra},g);
  const hash = s => {let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;return n;};
  function wings(g,at,t,color) {
    const mount = el('g',{'data-attachment':'wings_attachment',transform:`translate(${at.x} ${at.y})`},g);
    for(const side of [-1,1]) {
      const wing=el('g',{transform:`scale(${side} 1) rotate(${-8+Math.sin(t*4)*7})`},mount);
      path(wing,'M0,0 C-10,-18 -42,-52 -60,-54 Q-67,-29 -41,-14 Q-56,-16 -53,-5 Q-34,8 0,0Z',color);
      for(let i=0;i<4;i++) path(wing,`M-5,0 Q${-28-i*7},${-12-i*6} ${-40-i*4},${-19-i*7}`,'none',{stroke:'#7c8caa','stroke-width':1,opacity:.45});
    }
  }
  function effects(g,dna,t,seed,bounds) {
    const {x,y,w,h}=bounds;
    if(dna.effects.includes('fire_aura')) {
      const aura=el('g',{'data-effect':'fire_aura'},g);
      for(let i=0;i<7;i++) {const a=i/6,px=x+(a-.5)*w,py=y+h*.3,flame=h*(.3+.12*Math.sin(t*5+i));
        path(aura,`M${px-w*.12},${py} Q${px-w*.14},${py-flame*.4} ${px},${py-flame} Q${px+w*.18},${py-flame*.3} ${px+w*.1},${py}Z`,i%2?'#ffca48':'#ed6735',{opacity:.8}); }
    }
    if(dna.effects.includes('ice_tint')) el('rect',{x:x-w*.5,y:y-h*.6,width:w,height:h,rx:5,fill:'#b2e8ff',opacity:.24,'data-effect':'ice_tint'},g);
    if(dna.effects.includes('cracked_overlay')) {
      if(!root.rough) throw new Error('Local Rough.js vendor is missing; run scripts/build-cartoon-vendor.mjs.');
      const cracks=el('g',{'data-effect':'cracked_overlay'},g), gen=root.rough.generator();
      const points=[[x-w*.18,y-h*.2],[x+w*.08,y-h*.05],[x-w*.02,y+h*.08],[x+w*.2,y+h*.24]];
      for(const p of gen.toPaths(gen.linearPath(points,{seed:seed||1,roughness:1.3,stroke:'#3e3546',strokeWidth:1.5}))) path(cracks,p.d,p.fill||'none',{stroke:p.stroke,'stroke-width':p.strokeWidth});
    }
  }
  function prop(g,dna,t,seed) {
    const a=el('g',{'data-procedural-prop':dna.archetype,'data-primary':dna.palette.primary},g), c=dna.palette;
    if(dna.archetype==='sword') {
      path(a,'M-5,0 L-4,-48 L0,-61 L4,-48 L5,0Z',c.primary); path(a,'M0,-56 L3,-47 L3,-3 L0,-3Z','#ecf4ff',{opacity:.55});
      el('rect',{x:-13,y:-2,width:26,height:5,rx:2,fill:c.accent},a);el('rect',{x:-3,y:3,width:6,height:17,rx:2,fill:c.secondary},a);circle(a,0,21,4,c.accent);
      effects(a,dna,t,seed,{x:0,y:-26,w:16,h:50});
    } else if(dna.archetype==='shield') {
      path(a,'M-25,-55 Q0,-68 25,-55 L22,-19 Q14,0 0,10 Q-14,0 -22,-19Z',c.primary,{stroke:c.accent,'stroke-width':4});
      path(a,'M0,-55 L0,-1 M-18,-36 L18,-36','none',{stroke:c.secondary,'stroke-width':5});effects(a,dna,t,seed,{x:0,y:-25,w:46,h:65});
    } else if(dna.archetype==='umbrella') {
      stroke(a,P(0,20),P(0,-62),3.5,c.secondary);path(a,'M0,20 Q0,28 -7,27','none',{stroke:c.secondary,'stroke-width':3.5,'stroke-linecap':'round'});
      path(a,'M-46,-56 Q0,-108 46,-56 Q31,-63 15,-56 Q0,-63 -15,-56 Q-31,-63 -46,-56Z',c.primary,{stroke:c.secondary,'stroke-width':1.5});
      for(const x of [-15,15])path(a,`M0,-82 Q${x*.6},-70 ${x},-57`,'none',{stroke:c.accent,'stroke-width':1.2,opacity:.7});circle(a,0,-84,2.5,c.secondary);
      effects(a,dna,t,seed,{x:0,y:-74,w:92,h:46});
    } else if(dna.archetype==='stick') {
      stroke(a,P(0,24),P(0,-56),5,c.primary);circle(a,0,-58,4.5,c.secondary);stroke(a,P(-1,-20),P(1,-14),2,c.accent,{opacity:.6});
      effects(a,dna,t,seed,{x:0,y:-16,w:14,h:80});
    } else if(dna.archetype==='book') {
      el('rect',{x:-15,y:-22,width:30,height:24,rx:2,fill:c.primary},a);el('rect',{x:-12,y:-20,width:25,height:20,fill:c.secondary},a);
      el('rect',{x:-15,y:-22,width:4,height:24,fill:c.accent},a);for(const y of [-15,-10,-5])stroke(a,P(-6,y),P(9,y),1,'#9a8f7a');
      effects(a,dna,t,seed,{x:0,y:-10,w:30,h:24});
    } else if(dna.archetype==='lantern') {
      const glow=.75+.25*Math.sin(t*7+seed%7);path(a,'M-8,-30 Q0,-42 8,-30','none',{stroke:c.secondary,'stroke-width':2});
      circle(a,0,-14,16*glow,c.accent,{opacity:.25});el('rect',{x:-9,y:-30,width:18,height:4,rx:1,fill:c.primary},a);
      ellipse(a,0,-15,8,11,c.accent,{opacity:.9});el('rect',{x:-10,y:-4,width:20,height:5,rx:1,fill:c.primary},a);
      for(const x of [-8,8])stroke(a,P(x,-27),P(x,-4),1.5,c.secondary);effects(a,dna,t,seed,{x:0,y:-16,w:22,h:32});
    } else if(dna.archetype==='boat') {
      path(a,'M-82,-30 Q-62,0 0,0 Q62,0 82,-30 Q40,-20 0,-20 Q-40,-20 -82,-30Z',c.primary);
      path(a,'M-34,-21 Q0,-62 34,-21Z',c.secondary,{stroke:c.accent,'stroke-width':2});for(const x of [-50,-20,20,50])stroke(a,P(x,-17),P(x*.9,-4),1.2,c.accent,{opacity:.6});
      effects(a,dna,t,seed,{x:0,y:-26,w:150,h:40});
    } else if(dna.archetype==='tree') {
      const sway=Math.sin(t*1.3+seed%5)*2;el('rect',{x:-8,y:-72,width:16,height:72,rx:3,fill:c.secondary},a);
      const crown=el('g',{transform:`translate(${sway} 0)`},a);circle(crown,-27,-96,34,c.primary);circle(crown,27,-96,34,c.primary);circle(crown,0,-126,40,c.primary);circle(crown,-10,-118,16,c.accent,{opacity:.55});
      effects(a,dna,t,seed,{x:0,y:-98,w:112,h:100});
    } else if(dna.archetype==='house') {
      el('rect',{x:-56,y:-72,width:112,height:72,fill:c.primary},a);path(a,'M-70,-70 L0,-122 L70,-70Z',c.secondary);
      el('rect',{x:-13,y:-40,width:26,height:40,fill:'#4a3328'},a);el('rect',{x:24,y:-52,width:20,height:18,fill:c.accent,stroke:c.secondary,'stroke-width':2},a);el('rect',{x:-44,y:-52,width:20,height:18,fill:c.accent,stroke:c.secondary,'stroke-width':2},a);
      effects(a,dna,t,seed,{x:0,y:-58,w:112,h:112});
    } else {
      path(a,'M-65,-12 L-62,-32 L-35,-37 L-20,-57 L20,-57 L40,-36 L62,-31 L67,-12Z',c.primary);
      path(a,'M-28,-37 L-17,-51 L0,-51 L0,-37Z M5,-51 L18,-51 L33,-37 L5,-37Z','#b7d5e6');
      el('rect',{x:-63,y:-24,width:126,height:13,rx:5,fill:c.secondary},a);
      for(const x of [-40,40]) {circle(a,x,-10,13,'#253043');circle(a,x,-10,6,'#b7bfca');}
      ellipse(a,61,-30,5,3,'#ffe8a0');effects(a,dna,t,seed,{x:0,y:-35,w:113,h:35});
    }
    if(dna.attachments.length) wings(a,P(0,-35),t,c.accent);
    return a;
  }
  function head(g,dna,center,r,angle,micro,mouth) {
    const h=el('g',{'data-custom-head':1,'data-neck-angle':angle,transform:`translate(${center.x} ${center.y}) rotate(${angle+micro.nod})`},g), c=dna.palette;
    ellipse(h,0,0,r,r*1.08,c.primary);
    for(const side of [-1,1]) {ellipse(h,side*r*.97,0,r*.17,r*.28,c.primary);
      const eye=el('g',{transform:`translate(${side*r*.37} ${-r*.15}) scale(1 ${Math.max(.05,1-micro.blink)})`},h);
      ellipse(eye,0,0,r*.2,r*.14,dna.traits.glowingEyes?c.accent:'#fff4dc');circle(eye,side*r*.02,0,r*.085,'#26303a');
      path(h,`M${side*r*.15},${-r*.43} L${side*r*.58},${-r*.48}`,'none',{stroke:c.secondary,'stroke-width':r*.1,'stroke-linecap':'round'});
      if(dna.traits.horns) path(h,`M${side*r*.55},${-r*.8} Q${side*r*1.05},${-r*1.8} ${side*r*.98},${-r*2.05} Q${side*r*1.36},${-r*1.01} ${side*r*.8},${-r*.5}Z`,c.accent,{'data-trait':'horns'});
    }
    if(dna.archetype==='robot') {el('rect',{x:-r*.75,y:-r*.8,width:r*1.5,height:r*.22,fill:c.secondary},h);stroke(h,P(0,-r),P(0,-r*1.6),r*.1,c.secondary);circle(h,0,-r*1.7,r*.15,c.accent);}
    if(dna.archetype==='king') path(h,`M${-r*.7},${-r*.78} L${-r*.75},${-r*1.45} L${-r*.38},${-r*1.1} L0,${-r*1.6} L${r*.38},${-r*1.1} L${r*.75},${-r*1.45} L${r*.7},${-r*.78}Z`,c.accent,{'data-trait':'crown'});
    if(dna.archetype==='warrior') path(h,`M${-r},0 Q${-r*1.15},${-r*1.3} 0,${-r*1.35} Q${r*1.15},${-r*1.3} ${r},0 L${r*.75},${-r*.65} L${-r*.75},${-r*.65}Z`,c.secondary);
    path(h,`M${-r*.3},${r*.44} Q0,${r*(.55+mouth*.3)} ${r*.3},${r*.44}`,mouth>.2?'#59323a':'none',{stroke:'#59323a','stroke-width':r*.07});
    if(dna.traits.fangs) for(const side of [-1,1])path(h,`M${side*r*.22},${r*.44} l${-side*r*.14},${r*.3} l${-side*r*.05},${-r*.3}Z`,'#fff4db',{'data-trait':'fangs'});
    return h;
  }
  const SIZE={dog:.55,cat:.42,tiger:.95,cow:1.05,fish:.45,bird:.4};
  function actor(layer,{spec={},H=60,x=540,floor=900,facing=1,id}={}) {
    const scene=layer.closest?.('section[data-k]')?.dataset.k || 'local';
    const dna=root.ZDNA.validate(spec.dna), own=(id||spec.creation||`custom-${hash(JSON.stringify(dna))}`)+':'+scene, seed=hash(own);
    const outer=el('g',{'data-custom-id':own,'data-archetype':dna.archetype},layer);
    let shown, visible=true;
    const bio=root.ZPEOPLE.biometrics(spec), solve=(posture,phase=0,o={})=>root.ZBODY.pose3D(posture,phase,{spec,profile:bio.profile,...o});
    const me={
      id:own,spec,H,element:outer,
      pose:solve, gesture:(gesture,t,o={})=>root.ZBODY.gesture3D(gesture,t,{spec,profile:bio.profile,...o}),
      blend:(a,b,u)=>root.ZBODY.blend3D(a,b,u),
      draw(input,at={}) {
        const t=at.t??root.__zcTime?.t??0, mouth=Math.max(0,Math.min(1,at.mouth||0)), micro=root.ZRIG.motion(t,own,mouth,at.talking??mouth>0);
        const k=(at.H??H)/27*dna.scale*(SIZE[dna.archetype]||1), X=at.x??x,F=at.floor??floor,fc=at.facing??facing;
        const ps=root.ZANATOMY.alivePose(input?.joints?input:solve(input?.posture||'stand',input?.phase??t*100,input||{}),micro);
        const pr=q=>root.ZANATOMY.project(q,'front',{scale:1,cx:0,groundY:0,center:{x:0,y:0,z:0}}), J=Object.fromEntries(Object.entries(ps.joints).map(([name,q])=>[name,pr(q)]));
        const floating=dna.floating?Math.sin(t*2.4)*3-8:0;
        outer.replaceChildren(); outer.setAttribute('transform',`translate(${X} ${F}) scale(${fc*k} ${k})`);outer.setAttribute('display',visible?'inline':'none');
        const g=el('g',{transform:`translate(0 ${floating})`},outer), primary=dna.palette.primary,secondary=dna.palette.secondary;
        const humanoid=root.ZDNA.isHumanoid(dna.archetype), headMotion=i=>root.ZRIG.motion(t,own+':'+i,mouth,at.talking??mouth>0);
        if(dna.kind==='prop') { const base=el('g',{transform:`translate(0 ${-({sword:25,shield:12,car:3,umbrella:22,stick:26,book:4,lantern:6}[dna.archetype]||0)})`},g);prop(base,dna,t,seed); }
        else if(dna.archetype==='fish') {
          const sway=Math.sin(t*3+seed%9)*5;if(dna.attachments.length) wings(g,P(-5,-52),t,dna.palette.accent);
          path(g,`M-40,-40 L-74,${-60+sway} L-68,-40 L-74,${-20+sway}Z`,secondary);ellipse(g,0,-40,50,22*(1+micro.breath),primary);
          path(g,'M-10,-60 Q5,-80 18,-60Z',secondary);path(g,'M-5,-22 Q5,-8 16,-22Z',secondary);for(const x of [-22,-8,6])path(g,`M${x},-55 Q${x+8},-40 ${x},-25`,'none',{stroke:secondary,'stroke-width':1.5,opacity:.5});
          for(let i=0;i<dna.headCount;i++)head(g,dna,P(40,-40+(i-(dna.headCount-1)/2)*26),13,dna.headAngles[i],headMotion(i),mouth);
          effects(g,dna,t,seed,{x:0,y:-40,w:100,h:44});
        } else if(dna.archetype==='bird') {
          const flap=dna.floating?Math.sin(t*9)*22:0;for(const side of [-6,6]){stroke(g,P(side,-14),P(side,0),3,dna.palette.accent);stroke(g,P(side,0),P(side+7,0),2.5,dna.palette.accent);}
          path(g,'M-18,-28 L-44,-40 L-40,-24Z',secondary);ellipse(g,0,-30,24,17*(1+micro.breath),primary);
          path(g,`M-12,-34 Q-2,${-58-flap} 14,-36 Q4,-30 -12,-34Z`,secondary,{'data-bird-wing':1});
          for(let i=0;i<dna.headCount;i++){const h=head(g,dna,P(20+(i-(dna.headCount-1)/2)*20,-54),11,dna.headAngles[i],headMotion(i),mouth);path(h,'M9,-2 L20,2 L9,5Z',dna.palette.accent);}
          effects(g,dna,t,seed,{x:0,y:-32,w:52,h:40});
        } else if(dna.archetype!=='horse' && !humanoid) {
          // tiger, dog, cat, cow: the horse's four-leg plan with a short neck, a tail and species markings
          const sp={tiger:{tail:1,ears:'point'},dog:{tail:1,ears:'flop'},cat:{tail:1,ears:'point'},cow:{tail:1,ears:'flop',horns:1}}[dna.archetype];
          if(dna.attachments.length) wings(g,P(-3,-96),t,dna.palette.accent);
          for(const side of [-1,1])for(const offset of [-8,8]) {const a=P(side*37+offset,-60),b=P(side*40+offset,-5);stroke(g,a,b,11,primary);stroke(g,P(b.x-4,-2),P(b.x+6,-2),6,secondary);}
          path(g,`M-52,-84 Q-86,${-112+Math.sin(t*3)*6} -74,-120`,'none',{stroke:secondary,'stroke-width':6,'stroke-linecap':'round'});
          ellipse(g,0,-76,56,26*(1+micro.breath),primary);
          if(dna.archetype==='tiger')for(const x of [-34,-14,6,26])path(g,`M${x},-101 Q${x+6},-84 ${x},-70`,'none',{stroke:secondary,'stroke-width':5,'stroke-linecap':'round'});
          if(dna.archetype==='cow'){ellipse(g,-20,-82,13,9,secondary);ellipse(g,18,-68,10,7,secondary);}
          stroke(g,P(38,-86),P(50,-106),26,primary);
          for(let i=0;i<dna.headCount;i++){const angle=dna.headAngles[i],center=P(58+(i-(dna.headCount-1)/2)*38,-116);const h=head(g,dna,center,20,angle,headMotion(i),mouth);
            ellipse(h,9,10,12,8,dna.palette.accent);circle(h,17,7,2.5,secondary);
            for(const side of [-1,1]) sp.ears==='point'?path(h,`M${side*8},-15 L${side*17},-32 L${side*20},-10Z`,primary):path(h,`M${side*14},-14 Q${side*26},-8 ${side*20},8 Q${side*15},-2 ${side*10},-12Z`,secondary);
            if(sp.horns&&!dna.traits.horns)for(const side of [-1,1])path(h,`M${side*8},-18 Q${side*16},-30 ${side*24},-28 Q${side*16},-24 ${side*12},-16Z`,'#efe6cf');}
          effects(g,dna,t,seed,{x:0,y:-78,w:110,h:60});
        } else if(dna.archetype==='horse') {
          if(dna.attachments.length) wings(g,P(-3,-100),t,dna.palette.accent);
          for(const side of [-1,1])for(const offset of [-8,8]) {const a=P(side*37+offset,-63),b=P(side*40+offset,-5);stroke(g,a,b,9,primary);stroke(g,P(b.x-4,-2),P(b.x+6,-2),5,secondary);}
          ellipse(g,0,-78,58,27*(1+micro.breath),primary);path(g,'M-45,-86 Q-85,-100 -76,-44 Q-68,-57 -57,-58Z',secondary);
          stroke(g,P(35,-88),P(52,-128),24,primary);
          for(let i=0;i<dna.headCount;i++){const angle=dna.headAngles[i],center=P(60+(i-(dna.headCount-1)/2)*35,-138);const h=head(g,dna,center,18,angle,root.ZRIG.motion(t,own+':'+i,mouth,at.talking??mouth>0),mouth);ellipse(h,8,11,20,10,primary);path(h,'M-12,-12 L-9,-38 L1,-18Z',secondary);circle(h,20,9,2,secondary);}
          effects(g,dna,t,seed,{x:0,y:-80,w:110,h:60});
        } else {
          ellipse(g,0,1,22,3,'#1c2130',{opacity:.15});
          if(dna.attachments.length) wings(g,J.thorax,t,dna.palette.accent);
          if(dna.archetype==='ghost') { const L=J.hipL,R=J.hipR,y=Math.max(J.kneeL.y,J.kneeR.y)+8,w=Math.sin(t*4)*4; path(g,`M${L.x-8},${L.y} L${L.x-12},${y} Q${L.x/2-6},${y-10+w} 0,${y} Q${R.x/2+6},${y+10-w} ${R.x+12},${y} L${R.x+8},${R.y}Z`,primary,{opacity:.95,'data-ghost-sheet':1}); }
          else for(const side of ['L','R']) {stroke(g,J['hip'+side],J['knee'+side],14,secondary);stroke(g,J['knee'+side],J['ankle'+side],11,secondary);stroke(g,J['heel'+side],J['toe'+side],6,secondary);}
          path(g,`M${J.shoulderL.x},${J.shoulderL.y-3} Q0,${J.neckBase.y+6} ${J.shoulderR.x},${J.shoulderR.y-3} L${J.hipR.x+5},${J.hipR.y} Q0,${J.pelvis.y+4} ${J.hipL.x-5},${J.hipL.y}Z`,primary,{'data-custom-torso':1});
          if(dna.archetype==='king')path(g,`M${J.hipL.x-4},${J.pelvis.y} L${J.hipR.x+4},${J.pelvis.y}`,'none',{stroke:dna.palette.accent,'stroke-width':5});
          if(dna.archetype==='warrior')path(g,`M${J.shoulderL.x},${J.shoulderL.y} L0,${J.thorax.y+15} L${J.shoulderR.x},${J.shoulderR.y}`,'none',{stroke:dna.palette.accent,'stroke-width':5});
          for(let i=0;i<dna.armCount;i++) {
            const side=i%2?'R':'L', row=Math.floor(i/2), shift=15*row, S=P(J['shoulder'+side].x,J['shoulder'+side].y+shift), E=P(J['elbow'+side].x+(side==='R'?-row*4:row*4),J['elbow'+side].y+shift), W=P(J['wrist'+side].x,J['wrist'+side].y+shift);
            const a=el('g',{'data-custom-arm':i},g);stroke(a,S,E,8,primary);stroke(a,E,W,6.5,primary);ellipse(a,W.x,W.y+3,4,6,primary);
          }
          const r=root.ZANATOMY.RADII.head*ps.profile.headScale, neck=J.neckBase;
          for(let i=0;i<dna.headCount;i++) {
            const angle=dna.headAngles[i],center=P(J.head.x+(i-(dna.headCount-1)/2)*r*2.45,J.head.y-Math.abs(angle)/25*r*.2);
            const mount=el('g',{'data-neck-mount':i,'data-neck-x':neck.x,'data-neck-y':neck.y},g);stroke(mount,neck,P(center.x,center.y+r*.7),r*.48,primary);
            head(mount,dna,center,r,angle,root.ZRIG.motion(t,own+':head'+i,mouth,at.talking??mouth>0),mouth);
          }
          effects(g,dna,t,seed,{x:J.thorax.x,y:J.thorax.y,w:65,h:75});
          for(const held of dna.held) {
            const wrist=J['hand'+held.hand], h=el('g',{'data-held-hand':held.hand,transform:`translate(${wrist.x} ${wrist.y}) rotate(${held.hand==='R'?-15:15}) scale(${held.dna.scale})`},g);prop(h,held.dna,t,seed+17);
          }
        }
        const bb=g.getBBox();shown={ps,J,X,F,k,fc,bounds:{x:bb.x,y:bb.y,w:bb.width,h:bb.height}};
        const section=layer.closest?.('section[data-k]'), row=section?Number(section.dataset.k):null;
        const clip=layer.closest?.('.clip[data-start]'), time=root.__timelines?.main?.time();
        if(visible && (!clip||time==null||(time>=+clip.dataset.start&&time<+clip.dataset.start+ +clip.dataset.duration))) {
          if(humanoid) (root.__anatomy ||= {})[own]={pose:ps};
          (root.__custom ||= {})[own]={dna,k:row,joints:J,x:X,floor:F,scale:k,grounded:!dna.floating,heads:g.querySelectorAll('[data-custom-head]').length,arms:g.querySelectorAll('[data-custom-arm]').length};
          const cast=Object.keys(root.ZF?.cast||{}).find(id=>root.ZF.cast[id]===spec);
          if(cast && dna.kind!=='prop') (root.__who ||= {})[own]={cast,mouth,x:X,k:row,quiet:!!at.quiet,back:false,size:(at.H??H)*dna.scale};
        }
      },
      jointAt(name) {if(!shown?.J[name])throw new Error('Draw the custom actor before asking for its joint.');const p=shown.J[name];return P(shown.X+p.x*shown.k*shown.fc,shown.F+p.y*shown.k);},
      handAt(i){return me.jointAt(i===0||i==='L'?'handL':'handR');},
      show(on){visible=!!on;outer.setAttribute('display',on?'inline':'none');},
      box(){
        if(!shown)throw new Error('Draw the custom actor before framing.');const {ps,J,X,F,k,fc,bounds}=shown,r=root.ZANATOMY.RADII.head*ps.profile.headScale;
        if(!root.ZDNA.isHumanoid(dna.archetype)) {
          const view=outer.ownerSVGElement.viewBox.baseVal,aspect=view.width/view.height,virtualH=Math.max(bounds.h,bounds.w/aspect*1.08);
          const hp=virtualH/7.5,top=F+(bounds.y-(virtualH-bounds.h)/2)*k,floor=top+virtualH*k;
          return {x:X+(bounds.x+bounds.w/2)*k*fc,headY:top+hp*k/2,headTop:top,headPx:hp*k,floor,facing:fc,view:'front',posture:'stand',lm:{headTop:0,eyes:.5,chin:1,shoulders:1.5,chest:2,waist:3,hips:4,knees:6,feet:7.5},spec,upright:true,standHeads:7.5};
        }
        const top=Math.max(-J.head.y+r+(dna.traits.horns?r*1.3:0)+(dna.held.length?35:0),-bounds.y);
        const at=y=>(top+y)/(2*r), lm={headTop:0,eyes:.5,chin:1,shoulders:at(J.shoulderL.y),chest:at(J.thorax.y),waist:at(J.lumbar.y),hips:at(J.pelvis.y),knees:at(J.kneeL.y),feet:at(0)};
        return {x:X+J.head.x*k*fc,headY:F+J.head.y*k,headTop:F-top*k,headPx:2*r*k,floor:F,facing:fc,view:'front',posture:ps.posture,lm,spec,upright:true,standHeads:lm.feet};
      },
    };
    return me;
  }
  root.ZCUSTOM={actor,prop,validate: d=>root.ZDNA.validate(d)};
})(typeof window !== 'undefined' ? window : globalThis);
