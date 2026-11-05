import {AGENTS} from '../../../lib/agents';
import {routeProvider} from '../../../lib/router';
import {runOpenAI} from '../../../lib/providers/openai';
import {runGemini} from '../../../lib/providers/gemini';
import {serverDb} from '../../../lib/supabase-server';
export async function POST(req){
 const started=Date.now();
 try{
  const body=await req.json(); const {message,agent='NOVA',provider='auto',projectId=null}=body;
  if(!message?.trim()) return Response.json({error:'Task kosong'},{status:400});
  if(!AGENTS[agent]) return Response.json({error:'Agent tidak dikenal'},{status:400});
  const chosen=routeProvider({provider,agent,message});
  const system=`You are ${agent}, ${AGENTS[agent].role}, an AI employee inside RIZPRAM HQ owned by Rizpram. ${AGENTS[agent].prompt} Do not pretend external actions happened unless a tool actually performed them. Mark anything requiring owner approval clearly as WAITING FOR APPROVAL.`;
  const result=chosen==='gemini'?await runGemini({system,message}):chosen==='openai'?await runOpenAI({system,message}):null;
  if(!result) throw new Error(`${chosen} belum memiliki adapter`);
  const db=serverDb();
  if(db){
   await db.from('usage_logs').insert({agent,provider:chosen,model:result.model,input_tokens:result.usage.input,output_tokens:result.usage.output,total_tokens:result.usage.total,latency_ms:Date.now()-started,project_id:projectId||null});
   await db.from('activities').insert({agent,event:'completed',detail:`Completed via ${chosen}`,project_id:projectId||null});
  }
  return Response.json({provider:chosen,model:result.model,text:result.text,usage:result.usage,latencyMs:Date.now()-started});
 }catch(e){return Response.json({error:e.message||'Unknown error'},{status:500})}
}
