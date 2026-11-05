import {AGENTS} from './agents';
export const PROVIDERS=[
 {id:'openai',name:'OpenAI',status:'active'},
 {id:'gemini',name:'Gemini',status:'active'},
 {id:'openrouter',name:'OpenRouter',status:'active'},
 {id:'slot4',name:'Provider Slot 04',status:'reserved'},
 {id:'slot5',name:'Provider Slot 05',status:'reserved'},
 {id:'slot6',name:'Provider Slot 06',status:'reserved'}
];
export function routeProvider({provider='auto',agent='NOVA',message=''}){
 if(provider!=='auto') return provider;
 if(/image|visual|video|pdf|multimodal|research|compare|cari|riset/i.test(message)) return 'gemini';
 return AGENTS[agent]?.defaultProvider || 'openai';
}
