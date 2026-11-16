'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CornerDownLeft, MessageCircle, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';
import { homesFor } from '@/lib/engine';
import { daysBetween } from '@/lib/format';
import type { Task } from '@/lib/types';
import s from './ask.module.css';

type Result = { message:string; refs: {href:string; label:string}[]; mode:'demo'|'ai' };
const QUESTIONS=['What needs me today?','What is delayed?','Which changes are pending?','What closes next?'];

function demoAnswer(q:string, today:string, tasks:Task[], homes:ReturnType<typeof homesFor>, changes:{id:string;title:string;homeId:string;status:string}[]): Result {
  const needle=q.toLowerCase();
  const refs:{href:string;label:string}[]=[];
  const lines:string[]=[];
  if (/delay|behind|risk|late|schedule/.test(needle)) {
    const delayed=homes.filter(h=>h.behindWeeks>0);
    if(!delayed.length)lines.push('No schedule delays are flagged for the homes in this role’s demo view.');
    delayed.slice(0,5).forEach(h=>{lines.push(`Lot ${h.lot} · ${h.community} · ${h.behindWeeks} weeks behind.`);refs.push({href:`/homes/${h.id}`,label:`Open Lot ${h.lot}`});});
  } else if (/change|approval|quote|selection/.test(needle)) {
    if(!changes.length)lines.push('No requested or priced change orders are awaiting a decision in this demo view.');
    changes.slice(0,6).forEach(c=>lines.push(`${c.title} · ${c.status} · ${c.homeId.toUpperCase()}.`));
    refs.push({href:'/changes',label:'Review changes'});
  } else if (/clos|date|handover|next home/.test(needle)) {
    const next=homes.filter(h=>h.closing&&h.closing>=today).sort((a,b)=>(a.closing||'').localeCompare(b.closing||'')).slice(0,5);
    if(!next.length)lines.push('No upcoming closings are listed in this role’s demo view.');
    next.forEach(h=>{lines.push(`Lot ${h.lot} · ${h.closing} · ${h.community}.`);refs.push({href:`/homes/${h.id}`,label:`Open Lot ${h.lot}`});});
  } else if (/how many|total|open task/.test(needle)) {
    lines.push(`${tasks.length} open tasks are assigned to this role in the demo.`);
    lines.push(`${tasks.filter(t=>daysBetween(today,t.due)<=0).length} are due or overdue.`);
    refs.push({href:'/',label:'Open Today'});
  } else {
    const urgent=tasks.filter(t=>daysBetween(today,t.due)<=1);
    lines.push(urgent.length?`${urgent.length} tasks need attention today or tomorrow:`:'No tasks are due today or tomorrow for this role.');
    urgent.slice(0,5).forEach(t=>{lines.push(`• ${t.title} · ${t.due} (${t.id}).`);refs.push({href:`/?task=${encodeURIComponent(t.id)}`,label:`Open ${t.id}`});});
  }
  return { message:lines.join('\n'),refs,mode:'demo'};
}

export function AskContent() {
  const {state,role} = useStore();
  const [q,setQ]=useState('');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState('');
  const context=useMemo(()=>{
    const homes=homesFor(state,role);
    const ids=new Set(homes.map(h=>h.id));
    const tasks=state.tasks.filter(t=>t.role===role&&t.status==='open').sort((a,b)=>a.due.localeCompare(b.due));
    const changes=state.changes.filter(c=>ids.has(c.homeId)&&(c.status==='requested'||c.status==='priced'));
    return {homes,tasks,changes};
  },[role,state]);
  const ask=async(question:string)=>{
    if(!question.trim()||busy)return;
    setQ(question);setBusy(true);setError('');
    const instant=demoAnswer(question,state.today,context.tasks,context.homes,context.changes);
    setResult(instant);
    try {
      const payload={
        role,question:question.slice(0,500),today:state.today,
        tasks:context.tasks.slice(0,25).map(t=>({id:t.id,title:t.title,detail:t.detail,due:t.due,source:t.source,homeId:t.homeId})),
        delays:context.homes.filter(h=>h.behindWeeks>0).map(h=>({id:h.id,lot:h.lot,community:h.community,behindWeeks:h.behindWeeks,closing:h.closing})),
        changes:context.changes.map(c=>({id:c.id,homeId:c.homeId,title:c.title,status:c.status})),
        closings:context.homes.filter(h=>h.closing&&h.closing>=state.today).sort((a,b)=>(a.closing||'').localeCompare(b.closing||'')).slice(0,4).map(h=>({id:h.id,lot:h.lot,closing:h.closing}))
      };
      const response=await fetch('/api/intelligence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(response.ok){const data=await response.json();if(typeof data.answer==='string')setResult({message:data.answer,refs:instant.refs,mode:'ai'});}
      else if(response.status!==503){setError('AI is unavailable; showing instant demo lookup instead.');}
    }catch{setError('AI is unavailable; showing instant demo lookup instead.');}
    finally{setBusy(false);}
  };
  const submit=(e:FormEvent)=>{e.preventDefault();void ask(q);};
  return <div className={s.wrapper}>
    <div className={s.intro}><span className={s.spark}><MessageCircle size={17}/></span><div><strong>Find an answer fast.</strong><p>Ask about the sample projects, tasks and decisions.</p></div></div>
    <div className={s.chips}>{QUESTIONS.map(question=><button key={question} type="button" onClick={()=>void ask(question)}>{question}</button>)}</div>
    {result?<section className={s.result} aria-live="polite">
      <div className={s.resultTitle}><Sparkles size={14}/>{result.mode==='ai'?'AI answer · fictional demo records':'Instant lookup · fictional demo records'}</div>
      <p>{result.message}</p>
      {result.refs.length>0&&<div className={s.refs}>{result.refs.slice(0,4).map((r,i)=><Link href={r.href} key={i}>{r.label}<ArrowUpRight size={12}/></Link>)}</div>}
    </section>:<div className={s.placeholder}>Try “What needs me today?” to see the priority queue for your selected role.</div>}
    {error&&<p className={s.note} role="status">{error}</p>}
    <form onSubmit={submit} className={s.form}>
      <input value={q} onChange={e=>setQ(e.target.value)} maxLength={500} placeholder="Ask about tasks, closings, changes…" aria-label="Ask Marchand" />
      <button type="submit" aria-label="Send question" disabled={!q.trim()||busy}><CornerDownLeft size={19}/></button>
    </form>
    <p className={s.note}>Read-only demo. Live AI requires a provider connection. Real Marchand records are not connected.</p>
  </div>;
}
