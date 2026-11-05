import {serverDb} from '../../../lib/supabase-server';
export async function GET(){
 const db=serverDb(); if(!db) return Response.json({mode:'demo'});
 const [p,t,a,u,ap]=await Promise.all([db.from('projects').select('*').order('created_at',{ascending:false}),db.from('tasks').select('*').order('created_at',{ascending:false}),db.from('activities').select('*').order('created_at',{ascending:false}).limit(30),db.from('usage_logs').select('*').order('created_at',{ascending:false}).limit(100),db.from('approvals').select('*').order('created_at',{ascending:false}).limit(100)]);
 return Response.json({mode:'supabase',projects:p.data||[],tasks:t.data||[],activities:a.data||[],usage:u.data||[],approvals:ap.data||[]});
}
export async function POST(req){
 const db=serverDb(); if(!db) return Response.json({error:'Supabase belum dikonfigurasi'},{status:503});
 const {type,payload}=await req.json(); const table={project:'projects',task:'tasks',approval:'approvals'}[type]; if(!table)return Response.json({error:'Unknown type'},{status:400});
 const r=await db.from(table).insert(payload).select().single(); if(r.error)return Response.json({error:r.error.message},{status:400}); return Response.json(r.data);
}
export async function PATCH(req){
 const db=serverDb(); if(!db) return Response.json({error:'Supabase belum dikonfigurasi'},{status:503});
 const {type,id,payload}=await req.json(); const table={project:'projects',task:'tasks',approval:'approvals'}[type]; if(!table)return Response.json({error:'Unknown type'},{status:400});
 const r=await db.from(table).update(payload).eq('id',id).select().single(); if(r.error)return Response.json({error:r.error.message},{status:400}); return Response.json(r.data);
}
