# RIZPRAM HQ V2.1
Personal AI Company OS — serious orchestration build.

## New in V2.1
- NOVA Project Delegation: one owner goal -> project -> 3–8 delegated tasks.
- Agent execution endpoint: run individual delegated tasks with the assigned specialist.
- Approval gate: publishing/sending/spending/deleting/account changes can be held for owner approval.
- Supabase persistence for projects, tasks, approvals, activity, memory and AI usage.
- OpenAI + Gemini through a provider-independent gateway.
- Four reserved provider adapter slots for future providers.
- Demo mode still works without Supabase.

## Setup
1. `npm install`
2. `cp .env.example .env.local`
3. Add OpenAI and/or Gemini API keys.
4. Create a Supabase project and run `supabase/schema.sql` in SQL Editor.
5. Add Supabase URL + service role key to `.env.local`.
6. `npm run dev`
7. Open `http://localhost:3000`

## V2.1 workflow
Owner goal -> NOVA plans -> project saved -> tasks delegated -> owner runs agent tasks -> outputs saved -> sensitive/external actions wait in Approval Queue.

Important: V2.1 prepares external-action work but does not yet connect Gmail/Drive/GitHub/Calendar. Those tools belong in the next tool-connector layer.
