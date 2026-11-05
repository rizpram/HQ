export async function runGemini({system,message}){
 if(!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY belum diisi');
 const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system_instruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:message}]}]})});
 const d=await r.json(); if(!r.ok) throw new Error(d?.error?.message||'Gemini error');
 const u=d.usageMetadata||{};
 return {text:d.candidates?.[0]?.content?.parts?.map(x=>x.text||'').join('')||'',model,usage:{input:u.promptTokenCount||0,output:u.candidatesTokenCount||0,total:u.totalTokenCount||0}};
}
