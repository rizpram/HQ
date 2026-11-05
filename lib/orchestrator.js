import {AGENTS} from './agents';
import {routeProvider} from './router';
import {runOpenAI} from './providers/openai';
import {runGemini} from './providers/gemini';
import {runOpenRouter} from './providers/openrouter';

const KEYS={openai:'OPENAI_API_KEY',gemini:'GEMINI_API_KEY',openrouter:'OPENROUTER_API_KEY'};
const LABEL={openai:'OpenAI',gemini:'Gemini',openrouter:'OpenRouter'};
// nilai contoh/placeholder jangan dianggap kunci — kalau dianggap, request
// tetap dikirim lalu ditolak 401 oleh provider dan pesannya membingungkan
const PLACEHOLDER=/ganti|your[-_ ]|xxx+|placeholder|contoh|example|^[<{]/i;

export function hasKey(p){
  const v=(process.env[KEYS[p]]||'').trim();
  return !!v && !PLACEHOLDER.test(v);
}

export function availableProviders(){
  return ['openai','gemini','openrouter'].filter(hasKey);
}

// Provider pilihan dipakai kalau kuncinya ada; kalau tidak, jatuh ke yang tersedia.
// Mengembalikan null kalau tidak ada satu pun kunci yang valid.
export function resolveProvider(chosen){
  if(hasKey(chosen)) return chosen;
  const avail=availableProviders();
  if(avail.includes('openrouter')) return 'openrouter';
  return avail[0]||null;
}

function explain(provider,e){
  const msg=e?.message||String(e);
  const code=e?.status??e?.code;
  const name=LABEL[provider]||provider;
  if(code===401||code===403||/\b401\b|unauthor|missing authentication|no auth|invalid.*(key|token)/i.test(msg))
    return `Kunci ${name} ditolak (401). Periksa nilai ${KEYS[provider]} di Coolify → Environment Variables, lalu Redeploy.`;
  if(code===402||/insufficient|credit|quota|billing/i.test(msg))
    return `Kredit ${name} tidak cukup. Top up dulu, atau pakai BYOK dengan kunci provider Anda sendiri.`;
  if(code===404||/model.*(not found|does not exist|unknown)/i.test(msg))
    return provider==='openrouter'
      ? `Model tidak ditemukan di OpenRouter. Nama model wajib pakai prefix organisasi, misal openai/gpt-4o. Kosongkan OPENROUTER_MODEL untuk memakai default akun.`
      : `Model tidak ditemukan di ${name}. Periksa ${provider==='openai'?'OPENAI_MODEL':'GEMINI_MODEL'}.`;
  if(code===429||/rate.?limit|too many requests/i.test(msg))
    return `${name} kena rate limit. Tunggu sebentar lalu coba lagi.`;
  if(/fetch failed|ENOTFOUND|ECONNREFUSED|connection error|timeout/i.test(msg))
    return `Tidak bisa menghubungi ${name} dari server. Cek koneksi keluar VPS.`;
  return `${name}: ${msg}`;
}

export async function runProvider({provider,system,message}){
  if(!provider){
    throw new Error('Belum ada kunci provider yang valid. Isi salah satu dari OPENAI_API_KEY, GEMINI_API_KEY, atau OPENROUTER_API_KEY di Coolify → Environment Variables, lalu Redeploy.');
  }
  try{
    if(provider==='gemini') return await runGemini({system,message});
    if(provider==='openrouter') return await runOpenRouter({system,message});
    if(provider==='openai') return await runOpenAI({system,message});
    throw new Error(`${provider} belum memiliki adapter`);
  }catch(e){
    throw new Error(explain(provider,e));
  }
}

export async function runModel({agent='NOVA',provider='auto',message,systemExtra=''}){
  const chosen=resolveProvider(routeProvider({provider,agent,message}));
  const system=`You are ${agent}, ${AGENTS[agent]?.role||'AI employee'}, inside RIZPRAM HQ. ${AGENTS[agent]?.prompt||''} ${systemExtra} Never claim an external action happened unless a tool actually performed it.`;
  const result=await runProvider({provider:chosen,system,message});
  return {...result,provider:chosen};
}

export function extractJSON(text){
  const cleaned=text.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const s=cleaned.indexOf('{'), e=cleaned.lastIndexOf('}');
  if(s<0||e<s) throw new Error('Planner tidak mengembalikan JSON valid');
  return JSON.parse(cleaned.slice(s,e+1));
}
