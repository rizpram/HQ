import {AGENTS} from './agents';
import {routeProvider} from './router';
import {runOpenAI} from './providers/openai';
import {runGemini} from './providers/gemini';

export async function runModel({agent='NOVA',provider='auto',message,systemExtra=''}){
  const chosen=routeProvider({provider,agent,message});
  const system=`You are ${agent}, ${AGENTS[agent]?.role||'AI employee'}, inside RIZPRAM HQ. ${AGENTS[agent]?.prompt||''} ${systemExtra} Never claim an external action happened unless a tool actually performed it.`;
  const result=chosen==='gemini'?await runGemini({system,message}):await runOpenAI({system,message});
  return {...result,provider:chosen};
}
export function extractJSON(text){
  const cleaned=text.replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
  const s=cleaned.indexOf('{'), e=cleaned.lastIndexOf('}');
  if(s<0||e<s) throw new Error('Planner tidak mengembalikan JSON valid');
  return JSON.parse(cleaned.slice(s,e+1));
}
