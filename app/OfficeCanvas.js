'use client';
import {useEffect,useRef} from 'react';

// --- harus sama dengan tools/make-office.py ---
const ROOM_W=356, ROOM_H=226, TW=34, TH=16, OX=123, OY=48;
const iso=(tx,ty)=>({x:OX+(tx-ty)*(TW/2), y:OY+(tx+ty)*(TH/2)});

// Tempat berdiri tiap agent, di depan mejanya masing-masing (koordinat tile)
export const DESKS={
 BEAT :{tx:1.5, ty:1.3, room:'Studio'},
 DEX  :{tx:5.5, ty:1.3, room:'Dev'},
 KAI  :{tx:9.5, ty:1.3, room:'Creative'},
 SCOUT:{tx:10.3,ty:2.6, room:'Research'},
 MAYA :{tx:1.5, ty:4.3, room:'Executive'},
 ECHO :{tx:7.5, ty:4.3, room:'Content'},
 MONEY:{tx:1.5, ty:6.3, room:'Finance'},
 NOVA :{tx:5.5, ty:6.3, room:'Command'}
};
const APPROVAL={tx:8.2, ty:5.8};

// WAJIB sama urutannya dengan AGENTS di tools/make-sprites.py
const ORDER=['MAYA','NOVA','KAI','BEAT','DEX','SCOUT','MONEY','ECHO'];
const TINT={MAYA:0x6ea8ff,NOVA:0x2587ff,KAI:0xc77dff,BEAT:0xff8f6b,DEX:0x47d6a0,SCOUT:0x5fd0e6,MONEY:0xffc861,ECHO:0xff7fb0};
const FW=22,FH=30,FRAMES=4,SPEED=0.045;

const SAY={working:'lagi kerja', approval:'tunggu approval', busy:'ada tugas'};

export default function OfficeCanvas({agents=[],tasks=[],busyAgent=null,activity=[]}){
 const host=useRef(null), scene=useRef(null), pending=useRef(null), seenDone=useRef(new Set()), firstRun=useRef(true);

 function computeState(){
  const out={};
  for(const a of agents){
   const name=a[0], mine=tasks.filter(t=>t.agent===name);
   let mode='idle';
   if(busyAgent&&name===busyAgent) mode='working';
   else if(mine.some(t=>t.status==='approval')) mode='approval';
   else if(mine.some(t=>t.status==='todo')) mode='busy';
   out[name]={mode};
  }
  return out;
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
    preload(){
     this.load.image('room','/office-iso.png');
     this.load.spritesheet('agents','/agents.png',{frameWidth:FW,frameHeight:FH});
    }
    create(){
     this.textures.get('agents').setFilter(Phaser.Textures.FilterMode.NEAREST);
     this.textures.get('room').setFilter(Phaser.Textures.FilterMode.NEAREST);

     this.world=this.add.container(0,0);
     this.world.add(this.add.image(0,0,'room').setOrigin(0,0).setDepth(-1000));

     this.people={};
     for(const a of agents){
      const name=a[0], row=ORDER.indexOf(name); if(row<0) continue;
      const base=row*FRAMES, home=DESKS[name]||{tx:6,ty:3,room:''};
      const tint=TINT[name]||0x8fa4c4;

      this.anims.create({
       key:`walk-${name}`,
       frames:this.anims.generateFrameNumbers('agents',{start:base,end:base+FRAMES-1}),
       frameRate:8, repeat:-1
      });

      const c=this.add.container(0,0);
      const shadow=this.add.ellipse(0,0,17,6,0x000000,.5);
      const sp=this.add.sprite(0,2,'agents',base).setOrigin(.5,1);
      const pillbg=this.add.rectangle(0,-38,50,10,tint,.95).setScale(.85);
      const pill=this.add.text(0,-38,name,{fontFamily:'Inter,system-ui,sans-serif',fontSize:'7px',fontStyle:'700',color:'#07111f'}).setOrigin(.5).setScale(.85);
      const dot=this.add.circle(0,-40,0,0xffffff,0);
      const bang=this.add.text(0,-52,'!',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'14px',fontStyle:'900',color:'#ffd166'}).setOrigin(.5).setAlpha(0);
      c.add([shadow,sp,pillbg,pill,dot,bang]);
      this.world.add(c);

      const p=iso(home.tx,home.ty); c.x=p.x; c.y=p.y;
      this.people[name]={c,sp,pill,pillbg,bang,base,tint,home,target:{...home},mode:'idle',walking:false};
      this.setPill(name,'idle');
     }

     this.layout();
     this.scale.on('resize',()=>this.layout());
     if(pending.current){this.applyState(pending.current.state,pending.current.done);pending.current=null}
    }
    layout(){
     const s=Math.min(this.scale.width/ROOM_W, this.scale.height/ROOM_H);
     this.world.setScale(s);
     this.world.x=(this.scale.width-ROOM_W*s)/2;
     this.world.y=(this.scale.height-ROOM_H*s)/2;
    }
    setPill(name,mode){
     const p=this.people[name]; if(!p) return;
     p.pill.setText(mode==='idle' ? name : `${name} · ${SAY[mode]}`);
     p.pillbg.width=p.pill.width+10;
     p.pillbg.height=p.pill.height+4;
     // idle pakai warna redup, state aktif pakai warna agent
     p.pillbg.setFillStyle(mode==='idle'?0x16202f:p.tint, mode==='idle'?.9:.95);
     p.pill.setColor(mode==='idle'?'#9fb0c8':'#07111f');
    }
    depthSort(){
     Object.values(this.people).forEach(p=>p.c.setDepth(p.c.y));
     this.world.sort('depth');
    }
    applyState(state,done){
     for(const name in this.people){
      const p=this.people[name], s=state[name]; if(!s) continue;
      p.mode=s.mode;
      p.target = s.mode==='approval' ? APPROVAL : p.home;
      this.setPill(name,s.mode);
      p.bang.setAlpha(s.mode==='approval'?1:0);
     }
     for(const n of (done||[])) this.celebrate(n);
     this.depthSort();
    }
    celebrate(name){
     const p=this.people[name]; if(!p) return;
     const burst=this.add.circle(p.c.x,p.c.y-14,10).setStrokeStyle(2,0x47d6a0,1).setDepth(9999);
     this.world.add(burst);
     this.tweens.add({targets:burst,scale:3,alpha:0,duration:850,ease:'Cubic.Out',onComplete:()=>burst.destroy()});
     const tick=this.add.text(p.c.x,p.c.y-52,'✓',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'15px',fontStyle:'900',color:'#47d6a0'}).setOrigin(.5).setDepth(9999);
     this.world.add(tick);
     this.tweens.add({targets:tick,y:tick.y-20,alpha:0,duration:1000,ease:'Cubic.Out',onComplete:()=>tick.destroy()});
    }
    update(time,delta){
     const step=Math.min(delta/16.7,2);
     let moved=false;
     for(const name in this.people){
      const p=this.people[name], t=iso(p.target.tx,p.target.ty);
      const dx=t.x-p.c.x, dy=t.y-p.c.y;
      const walking=Math.hypot(dx,dy)>1.2;
      if(walking){
       p.c.x+=dx*SPEED*step; p.c.y+=dy*SPEED*step; moved=true;
       if(Math.abs(dx)>.6) p.sp.setFlipX(dx<0);
       if(!p.walking){p.sp.play(`walk-${name}`);p.walking=true}
      }else if(p.walking){
       p.sp.stop(); p.sp.setFrame(p.base); p.sp.setFlipX(false); p.walking=false;
      }
      if(!walking) p.sp.y=2+(Math.sin(time/560+p.base)>0?0:1);
      if(p.mode==='working') p.pillbg.setAlpha(.6+Math.sin(time/230)*.35);
      else if(p.mode!=='idle') p.pillbg.setAlpha(.95);
      if(p.mode==='approval') p.bang.y=-52+Math.sin(time/260)*3;
     }
     if(moved) this.depthSort();
    }
   }

   game=new Phaser.Game({
    type:Phaser.AUTO, parent:host.current, transparent:true, pixelArt:true,
    scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},
    scene:Office, banner:false
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
