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
const COLOR={MAYA:0x6ea8ff,NOVA:0x2587ff,KAI:0xc77dff,BEAT:0xff8f6b,DEX:0x47d6a0,SCOUT:0x5fd0e6,MONEY:0xffc861,ECHO:0xff7fb0};
const SPEED=0.055; // interpolasi per frame

export default function OfficeCanvas({agents=[],tasks=[],busyAgent=null,activity=[]}){
 const host=useRef(null), scene=useRef(null), pending=useRef(null), seenDone=useRef(new Set()), firstRun=useRef(true);

 // Hitung state tiap agent dari data HQ yang sudah ada
 function computeState(){
  const byAgent={};
  for(const a of agents){
   const name=a[0];
   const mine=tasks.filter(t=>t.agent===name);
   let mode='idle';
   if(busyAgent&&name===busyAgent) mode='working';
   else if(mine.some(t=>t.status==='approval')) mode='approval';
   else if(mine.some(t=>t.status==='todo')) mode='busy';
   byAgent[name]={mode,role:a[1]};
  }
  return byAgent;
 }

 // Task yang baru saja selesai -> picu animasi sekali
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
    create(){
     this.people={};
     for(const a of agents){
      const name=a[0], col=COLOR[name]||0x7f8da6, r=ROOMS[name]||{x:.5,y:.5,label:''};
      const c=this.add.container(0,0);
      const shadow=this.add.ellipse(0,15,26,8,0x000000,.4);
      const ring=this.add.circle(0,0,17).setStrokeStyle(2,col,.85).setAlpha(0);
      const body=this.add.circle(0,0,12,col,.95);
      const init=this.add.text(0,0,name[0],{fontFamily:'Inter,system-ui,sans-serif',fontSize:'12px',fontStyle:'800',color:'#06101f'}).setOrigin(.5);
      const tagbg=this.add.rectangle(0,27,60,14,0x0c1421,.92).setStrokeStyle(1,0x2b405e,.9);
      const tag=this.add.text(0,27,name,{fontFamily:'Inter,system-ui,sans-serif',fontSize:'9px',color:'#cbd8ee'}).setOrigin(.5);
      const bang=this.add.text(0,-24,'!',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'15px',fontStyle:'900',color:'#ffc861'}).setOrigin(.5).setAlpha(0);
      c.add([shadow,ring,body,init,tagbg,tag,bang]);
      this.people[name]={c,body,ring,tag,tagbg,bang,col,home:r,target:{...r},mode:'idle',phase:Math.random()*6.28};
      this.fitTag(this.people[name]);
      this.place(name,r);
     }
     this.scale.on('resize',()=>{for(const n in this.people){const p=this.people[n];this.place(n,p.target,true)}});
     if(pending.current){this.applyState(pending.current.state,pending.current.done);pending.current=null}
    }
    fitTag(p){p.tagbg.width=p.tag.width+12;p.tagbg.height=p.tag.height+6}
    px(r){const w=this.scale.width,h=this.scale.height;return{x:r.x*w,y:r.y*h}}
    place(name,r,snap){const p=this.people[name];if(!p)return;const t=this.px(r);if(snap||p.c.x===0){p.c.x=t.x;p.c.y=t.y}}
    applyState(state,done){
     for(const name in this.people){
      const p=this.people[name], s=state[name]; if(!s) continue;
      p.mode=s.mode;
      // approval menunggu -> berdiri diam di meja approval
      p.target = s.mode==='approval' ? APPROVAL : p.home;
      const label = s.mode==='working'?'working…' : s.mode==='approval'?'waiting approval' : s.mode==='busy'?'has task' : p.home.label;
      p.tag.setText(`${name} · ${label}`);
      p.tag.setColor(s.mode==='working'?'#8fd0ff':s.mode==='approval'?'#ffc861':s.mode==='busy'?'#cbd8ee':'#8795ad');
      this.fitTag(p);
      p.bang.setAlpha(s.mode==='approval'?1:0);
      if(s.mode!=='working') p.ring.setAlpha(0);
     }
     for(const name of (done||[])) this.celebrate(name);
    }
    celebrate(name){
     const p=this.people[name]; if(!p) return;
     const burst=this.add.circle(p.c.x,p.c.y,14).setStrokeStyle(3,0x47d6a0,1);
     this.tweens.add({targets:burst,scale:3,alpha:0,duration:900,ease:'Cubic.Out',onComplete:()=>burst.destroy()});
     const tick=this.add.text(p.c.x,p.c.y-30,'✓',{fontFamily:'Inter,system-ui,sans-serif',fontSize:'18px',fontStyle:'900',color:'#47d6a0'}).setOrigin(.5);
     this.tweens.add({targets:tick,y:tick.y-26,alpha:0,duration:1100,ease:'Cubic.Out',onComplete:()=>tick.destroy()});
    }
    update(time,delta){
     const step=Math.min(delta/16.7,2);
     for(const name in this.people){
      const p=this.people[name], t=this.px(p.target);
      const dx=t.x-p.c.x, dy=t.y-p.c.y, dist=Math.hypot(dx,dy);
      const moving=dist>1.5;
      if(moving){p.c.x+=dx*SPEED*step;p.c.y+=dy*SPEED*step}
      // goyangan: cepat saat jalan, pelan saat diam
      p.phase+=(moving?.22:.045)*step;
      p.body.y=Math.sin(p.phase)*(moving?2.6:1.1);
      if(p.mode==='working'){
       p.ring.setAlpha(.35+Math.sin(time/220)*.35);
       p.ring.setScale(1+Math.sin(time/220)*.12);
      }
      if(p.mode==='approval') p.bang.y=-24+Math.sin(time/260)*3;
     }
    }
   }

   game=new Phaser.Game({
    type:Phaser.AUTO,
    parent:host.current,
    transparent:true,
    scale:{mode:Phaser.Scale.RESIZE,width:'100%',height:'100%'},
    scene:Office,
    banner:false
   });
   game.events.once('ready',()=>{scene.current=game.scene.getScene('office')});
   scene.current=game.scene.getScene('office');
  })();
  return ()=>{killed=true;scene.current=null;try{game&&game.destroy(true)}catch{}};
 // sengaja sekali jalan: game dibuat sekali, state dikirim lewat effect di bawah
 },[]); // eslint-disable-line react-hooks/exhaustive-deps

 // Kirim state HQ ke scene setiap kali data berubah
 useEffect(()=>{
  const state=computeState(), done=freshlyDone();
  const s=scene.current;
  if(s&&s.applyState) s.applyState(state,done);
  else pending.current={state,done};
 },[agents,tasks,busyAgent,activity]); // eslint-disable-line react-hooks/exhaustive-deps

 return <div ref={host} className="officefx"/>;
}
