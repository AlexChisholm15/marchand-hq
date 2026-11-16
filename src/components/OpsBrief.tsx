'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowUpRight, Check, ClipboardCopy, Copy, Clock3, Filter, ListChecks } from 'lucide-react';
import { useStore } from '@/lib/store';
import { homesFor } from '@/lib/engine';
import { daysBetween } from '@/lib/format';
import { canSeeInternal } from '@/lib/people';
import type { Task } from '@/lib/types';
import s from './ops.module.css';

type View = 'priority' | 'week' | 'all';
const dueDays = (today:string, due:string) => daysBetween(today, due);
const urgency = (today:string,t:Task) => dueDays(today,t.due)<0 ? 'Overdue' : dueDays(today,t.due)===0 ? 'Today' : dueDays(today,t.due)===1 ? 'Tomorrow' : t.due;

export function OpsBrief(){
  const {state,role} = useStore();
  const [view,setView] = useState<View>('priority');
  const [copied,setCopied] = useState(false);
  const [copyError,setCopyError] = useState(false);
  const data = useMemo(()=>{
    const tasks=state.tasks.filter(t=>t.role===role&&t.status==='open').sort((a,b)=>a.due.localeCompare(b.due));
    const homes=homesFor(state,role);
    const homeIds=new Set(homes.map(h=>h.id));
    const delays=homes.filter(h=>h.behindWeeks>0);
    const changes=state.changes.filter(c=>homeIds.has(c.homeId)&&['requested','priced'].includes(c.status));
    const due=tasks.filter(t=>t.due<=state.today);
    const next=tasks.filter(t=>dueDays(state.today,t.due)<=7);
    return {tasks,delays,changes,due,next};
  },[state,role]);
  const displayed=view==='all'?data.tasks:view==='week'?data.next:data.due.length?data.due:data.next.slice(0,3);
  const copy=async()=>{
    const text=[
      `Marchand HQ · ${role.toUpperCase()} · ${state.today} · SAMPLE DATA`,
      `Open: ${data.tasks.length} | Due/overdue: ${data.due.length} | Delays: ${data.delays.length} | Changes awaiting action: ${data.changes.length}`,
      ...data.tasks.map(t=>`[${urgency(state.today,t.due)}] ${t.title} (${t.id})`),
      ...data.delays.map(h=>`Delay: Lot ${h.lot}, ${h.community}, ${h.behindWeeks} weeks behind`),
      'Generated from fictional demo records; not live Marchand business data.',
    ].join('\n');
    try{await navigator.clipboard.writeText(text);setCopied(true);setCopyError(false);}catch{setCopyError(true);}
  };
  return <section className={s.wrap} aria-label="Operations brief">
    <div className={s.head}>
      <div>
        <span className={s.eyebrow}><span className={s.liveDot}/> DEMO OPERATIONS · {state.today}</span>
        <h2 className={s.title}>Your command brief</h2>
        <p className={s.sub}>The next decisions, not another dashboard.</p>
      </div>
      <button type="button" className={s.copy} onClick={()=>void copy()} title="Copy this role's operational handoff">
        {copied?<Check size={15}/>:<ClipboardCopy size={15}/>}<span>{copied?'Copied':'Copy handoff'}</span>
      </button>
    </div>
    {copyError&&<p role="status" className={s.sub}>Copy was blocked by this browser.</p>}
    <div className={s.metrics}>
      <div className={s.metric}><span>Needs action</span><strong>{data.due.length}</strong><small>Due or overdue</small></div>
      <div className={s.metric}><span>Open queue</span><strong>{data.tasks.length}</strong><small>Your role</small></div>
      {canSeeInternal(role) && <div className={s.metric}><span>Delayed homes</span><strong>{data.delays.length}</strong><small>Visible to you</small></div>}
      <div className={s.metric}><span>Pending changes</span><strong>{data.changes.length}</strong><small>Awaiting decision</small></div>
    </div>
    <div className={s.queueHead}>
      <div className={s.queueTitle}><ListChecks size={16}/> Decision queue</div>
      <div className={s.switches} role="group" aria-label="Task view">
        {([['priority','Now'],['week','7 days'],['all','All']] as const).map(([id,label])=>
          <button key={id} type="button" className={view===id?s.active:''} aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}
      </div>
    </div>
    <div className={s.queue}>
      {displayed.length?displayed.slice(0,6).map(t=><Link href={`/?task=${encodeURIComponent(t.id)}`} key={t.id} className={s.task}>
        <span className={t.due<state.today?s.danger:s.time}><Clock3 size={13}/>{urgency(state.today,t)}</span>
        <strong>{t.title}</strong><span className={s.source}>{t.source}{t.homeId?' · Home '+t.homeId.toUpperCase():''}</span>
        <ArrowUpRight size={15} className={s.arrow}/>
      </Link>):<div className={s.empty}><Check size={17}/> No items in this view. Switch to All to see upcoming work.</div>}
    </div>
    {(data.delays.length>0||data.changes.length>0)&&
      <div className={s.watch}>
        {data.delays.length>0&&canSeeInternal(role)&&<Link href="/homes" className={s.watchLink}><AlertTriangle size={15}/> {data.delays.length} home{data.delays.length!==1?'s':''} behind schedule <ArrowUpRight size={14}/></Link>}
        {data.changes.length>0&&<Link href="/changes" className={s.watchLink}><Filter size={15}/> {data.changes.length} change{data.changes.length!==1?'s':''} to review <ArrowUpRight size={14}/></Link>}
      </div>}
    <p className={s.demo}>Sample data only. Counts refresh as you complete demo actions; nothing is sent to Marchand Homes.</p>
  </section>;
}
