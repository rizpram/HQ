import {runModel,extractJSON} from '../../../lib/orchestrator';
import {serverDb} from '../../../lib/supabase-server';
export async function POST(req){
 try{
  const {goal,provider='auto'}=await req.json(); if(!goal?.trim()) return Response.json({error:'Goal kosong'},{status:400});
  const r=await runModel({agent:'NOVA',provider,message:goal,systemExtra:`Act as chief of staff. Convert the owner's goal into ONE project and 3-8 executable tasks. Delegate only to MAYA,NOVA,KAI,BEAT,DEX,SCOUT,MONEY,ECHO. Return JSON only: {"project":{"name":"...","description":"..."},"tasks":[{"title":"...","description":"...","agent":"DEX","priority":"high|medium|low","needsApproval":false}]}. needsApproval=true only for publishing, sending, spending, deleting, external account changes, or irreversible actions.`});
  const plan=extractJSON(r.text); const db=serverDb(); let projectId=null, savedTasks=[];
  if(db){
   const {data:p,error:pe}=await db.from('projects').insert({name:plan.project.name,description:plan.project.description,status:'active',progress:0}).select().single(); if(pe) throw pe; projectId=p.id;
   const rows=plan.tasks.map(t=>({project_id:projectId,title:t.title,description:t.description||'',agent:t.agent||'NOVA',priority:t.priority||'medium',status:t.needsApproval?'approval':'todo'}));
   const {data:ts,error:te}=await db.from('tasks').insert(rows).select(); if(te) throw te; savedTasks=ts;
   const approvals=savedTasks.filter(t=>t.status==='approval').map(t=>({task_id:t.id,title:t.title,payload:{reason:'Owner approval required before execution'}})); if(approvals.length) await db.from('approvals').insert(approvals);
   await db.from('activities').insert({project_id:projectId,agent:'NOVA',event:'planned',detail:`Created ${savedTasks.length} delegated tasks`});
  }
  return Response.json({plan,projectId,tasks:savedTasks,provider:r.provider,model:r.model,usage:r.usage});
 }catch(e){return Response.json({error:e.message||'Orchestration failed'},{status:500})}
}
