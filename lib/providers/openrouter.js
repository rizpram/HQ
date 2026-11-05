import OpenAI from 'openai';
export async function runOpenRouter({system,message}){
 if(!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY belum diisi');
 const client=new OpenAI({
  apiKey:process.env.OPENROUTER_API_KEY,
  baseURL:process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1',
  defaultHeaders:{'HTTP-Referer':process.env.OPENROUTER_SITE_URL||'https://hq.rizpram.cloud','X-Title':'RIZPRAM HQ'}
 });
 // Model dikosongkan = pakai default model akun OpenRouter.
 // Kalau diisi, wajib pakai prefix organisasi, mis. openai/gpt-4o atau anthropic/claude-sonnet-4.6
 const model=process.env.OPENROUTER_MODEL||'';
 const req={input:message,instructions:system};
 if(model) req.model=model;
 const out=await client.responses.create(req);
 return {
  text:out.output_text||'',
  model:out.model||model||'openrouter-default',
  usage:{input:out.usage?.input_tokens||0,output:out.usage?.output_tokens||0,total:out.usage?.total_tokens||0}
 };
}
