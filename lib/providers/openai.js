import OpenAI from 'openai';
export async function runOpenAI({system,message}){
 if(!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY belum diisi');
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
 const model=process.env.OPENAI_MODEL||'gpt-5-mini';
 const out=await client.responses.create({model,input:[{role:'system',content:system},{role:'user',content:message}]});
 return {text:out.output_text||'',model,usage:{input:out.usage?.input_tokens||0,output:out.usage?.output_tokens||0,total:out.usage?.total_tokens||0}};
}
