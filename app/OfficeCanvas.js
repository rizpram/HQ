'use client';
import {useEffect,useRef} from 'react';

// Posisi ruangan dalam rasio terhadap ukuran kanvas, disamakan dengan
// titik pin lama di style.css supaya cocok dengan ilustrasi office.png
export const ROOMS={
 BEAT :{x:.19,y:.21,label:'Studio'},
 DEX  :{x:.43,y:.32,label:'Dev'},
 KAI  :{x:.66,y:.22,label:'Creative'},
 SCOUT:{x:.80,y:.36,label:'Research'},
 MAYA :{x:.33,y:.48,label:'Executive'},
 ECHO :{x:.68,y:.56,label:'Content'},
 MONEY:{x:.18,y:.60,label:'Finance'},
 NOVA :{x:.46,y:.64,label:'Command'}
};
const APPROVAL={x:.57,y:.44,label:'Approval'};
// WAJIB sama urutannya dengan AGENTS di tools/make-sprites.py
const ORDER=['MAYA','NOVA','KAI','BEAT','DEX','SCOUT','MONEY','ECHO'];
const FW=22,FH=30,FRAMES=4,SCALE=1.45,SPEED=0.05;

export default function OfficeCanvas({agents=[],tasks=[],busyAgent=null,activity=[]}){
 const host=useRef(null), scene=useRef(null), pending=useRef(null), seenDone=useRef(new Set()), firstRun=useRef(true);

 function computeState(){
  const byAgent={};
  for(const a of agents){
   const name=a[0];
   const mine=tasks.filter(t=>t.agent===name);
   let mode='idle';
   if(busyAgent&&name===busyAgent) mode='working';
   else if(mine.some(t=>t.status==='approval')) mode='approval';
   else if(mine.some(t=>t.status==='todo')) mode='busy';
   byAgent[name]={mode};
  }
  return byAgent;
 }

 function freshlyDone(){
  const out=[];
  for(const t of tasks){
   if(t.status!=='done') continue;
   const id=t.id||`${t.agent}:${t.title}`;
   if(firstRun.current){seenDone.current.add(id);continue}
   if(!seenDone.current.has(id)){seenDone.current.add(id);out.push(t.agent)}
  }
  firstRun.current=false;
  return out;
 }

 useEffect(()=>{
  let game, killed=false;
  (async()=>{
   const Phaser=(await import('phaser')).default;
   if(killed||!host.current) return;

   class Office extends Phaser.Scene{
    constructor(){super('office')}
    preload(){this.load.spritesheet('agents','/agents.png',{frameWidth:FW,frameHeight:FH})}
    create(){
     this.textures.get('agents').setFilter(Phaser.Textures.FilterMode.NEAREST);
     this.people={};
     for(const a of agents){
      const name=a[0], row=ORDER.indexOf(name); if(row<0) continue;
      const base=row*FRAMES, home=ROOMS[name]||{x:.5,y:.5,label:''};

      this.anims.create({
       key:`walk-${name}`,
       frames:this.anims.generateFrameNumbers('agents',{start:base,end:base+FRAMES-1}),
       frameRate:8, repeat:-1
      });

      const c=this.add.container(0,0);
      const shadow=this.add.ellipse(0,0,20,6,0x000000,.45);
      const ring=this.add.circle(0,-22,21).setStrokeStyle(2,0x8fd0ff,.9).setAlpha(0);
      const sp=this.add.sprite(0,2,'agents',base).setOrigin(.5,1).setScale(SCALE);
      const tagbg=this.add.rectangle(0,14,60,13,0x0c1421,.92).setStrokeStyle(1,0x2b405e,.9);
      const tag=this.add.text(0,14,name,{fontFamily:'Inter,system-ui,sans-serif',fontSize:'9px',color:'#cbd8ee'}).setOrigin(.5);
      const bang=this.add.text(0,-52,'!',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'16px',fontStyle:'900',color:'#ffc861'}).setOrigin(.5).setAlpha(0);
      c.add([shadow,ring,sp,tagbg,tag,bang]);

      this.people[name]={c,sp,ring,tag,tagbg,bang,base,home,target:{...home},mode:'idle',walking:false};
      const p=this.px(home); c.x=p.x; c.y=p.y;
      this.fitTag(this.people[name]);
     }
     this.depthSort();
     this.scale.on('resize',()=>{for(const n in this.people){const p=this.people[n],t=this.px(p.target);p.c.x=t.x;p.c.y=t.y}});
     if(pending.current){this.applyState(pending.current.state,pending.current.done);pending.current=null}
    }
    fitTag(p){p.tagbg.width=p.tag.width+12;p.tagbg.height=p.tag.height+6}
    px(r){return{x:r.x*this.scale.width,y:r.y*this.scale.height}}
    // yang berdiri lebih bawah digambar di depan
    depthSort(){Object.values(this.people).sort((a,b)=>a.c.y-b.c.y).forEach((p,i)=>p.c.setDepth(i))}
    applyState(state,done){
     for(const name in this.people){
      const p=this.people[name], s=state[name]; if(!s) continue;
      p.mode=s.mode;
      p.target = s.mode==='approval' ? APPROVAL : p.home;
      const label = s.mode==='working'?'working…' : s.mode==='approval'?'waiting approval' : s.mode==='busy'?'has task' : p.home.label;
      p.tag.setText(`${name} · ${label}`);
      p.tag.setColor(s.mode==='working'?'#8fd0ff':s.mode==='approval'?'#ffc861':s.mode==='busy'?'#cbd8ee':'#9aa8bf');
      this.fitTag(p);
      p.bang.setAlpha(s.mode==='approval'?1:0);
      if(s.mode!=='working') p.ring.setAlpha(0);
     }
     for(const name of (done||[])) this.celebrate(name);
    }
    celebrate(name){
     const p=this.people[name]; if(!p) return;
     const burst=this.add.circle(p.c.x,p.c.y-20,14).setStrokeStyle(3,0x47d6a0,1).setDepth(99);
     this.tweens.add({targets:burst,scale:3,alpha:0,duration:900,ease:'Cubic.Out',onComplete:()=>burst.destroy()});
     const tick=this.add.text(p.c.x,p.c.y-56,'✓',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'20px',fontStyle:'900',color:'#47d6a0'}).setOrigin(.5).setDepth(99);
     this.tweens.add({targets:tick,y:tick.y-26,alpha:0,duration:1100,ease:'Cubic.Out',onComplete:()=>tick.destroy()});
    }
    update(time,delta){
     const step=Math.min(delta/16.7,2);
     let moved=false;
     for(const name in this.people){
      const p=this.people[name], t=this.px(p.target);
      const dx=t.x-p.c.x, dy=t.y-p.c.y;
      const walking=Math.hypot(dx,dy)>2;
      if(walking){
       p.c.x+=dx*SPEED*step; p.c.y+=dy*SPEED*step; moved=true;
       if(Math.abs(dx)>1) p.sp.setFlipX(dx<0);
       if(!p.walking){p.sp.play(`walk-${name}`);p.walking=true}
      }else if(p.walking){
       p.sp.stop(); p.sp.setFrame(p.base); p.sp.setFlipX(false); p.walking=false;
      }
      if(!walking) p.sp.y=2+(Math.sin(time/520+p.base)>0?0:1); // napas pelan saat diam
      if(p.mode==='working'){
       p.ring.setAlpha(.3+Math.sin(time/220)*.35);
       p.ring.setScale(1+Math.sin(time/220)*.1);
      }
      if(p.mode==='approval') p.bang.y=-52+Math.sin(time/260)*3;
     }
     if(moved) this.depthSort();
    }
   }

   game=new Phaser.Game({
    type:Phaser.AUTO,
    parent:host.current,
    transparent:true,
    pixelArt:true,
    scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},
    scene:Office,
    banner:false
   });
   const grab=()=>{scene.current=game.scene.getScene('office')};
   game.events.once('ready',grab); grab();
  })();
  return ()=>{killed=true;scene.current=null;try{game&&game.destroy(true)}catch{}};
 },[]); // eslint-disable-line react-hooks/exhaustive-deps

 useEffect(()=>{
  const state=computeState(), done=freshlyDone();
  const s=scene.current;
  if(s&&s.applyState&&s.people) s.applyState(state,done);
  else pending.current={state,done};
 },[agents,tasks,busyAgent,activity]); // eslint-disable-line react-hooks/exhaustive-deps

 return <div ref={host} className="officefx"/>;
}
