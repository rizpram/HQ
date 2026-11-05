import {AGENTS} from './agents';
import {routeProvider} from './router';
import {runOpenAI} from './providers/openai';
import {runGemini} from './providers/gemini';
import {runOpenRouter} from './providers/openrouter';

const KEYS={openai:'OPENAI_API_KEY',gemini:'GEMINI_API_KEY',openrouter:'OPENROUTER_API_KEY'};

export function hasKey(p){return !!process.env[KEYS[p]]}

// Kalau provider pilihan tidak punya kunci tapi OpenRouter punya, lewatkan ke OpenRouter.
export function resolveProvider(chosen){
  if(hasKey(chosen)) return chosen;
  if(hasKey('openrouter')) return 'openrouter';
  return chosen;
}

export async function runProvider({provider,system,message}){
  if(provider==='gemini') return runGemini({system,message});
  if(provider==='openrouter') return runOpenRouter({system,message});
  if(provider==='openai') return runOpenAI({system,message});
  throw new Error(`${provider} belum memiliki adapter`);
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
