'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { canOpenStudio, persistDrafts } from '@/lib/demoSafety';
import { useStore } from '@/lib/store';
import { Page } from '@/components/Shell';
import { finalPrice, homesFor } from '@/lib/engine';
import { money, fmtDate } from '@/lib/format';
import { STAGES } from '@/lib/seed';
import { summarizeDraft } from '@/lib/quoteDraft';
import type { Home, Task } from '@/lib/types';
import s from './studio.module.css';

type Tab = 'decisions' | 'quote' | 'closeout' | 'issues';
type QuoteLine = { id: string; label: string; qty: number; unit: number };
type Issue = { id: string; homeId: string; title: string; priority: 'Critical' | 'Important' | 'Normal'; owner: 'Scott' | 'Jeff' | 'Project manager' | 'Designer'; done: boolean };
const TABS: { id: Tab; label: string }[] = [
  {id:'decisions',label:'Decision desk'}, {id:'quote',label:'Quote Studio'},
  {id:'closeout',label:'Closing desk'}, {id:'issues',label:'Site issues'}
];
const CHECKS = ['Closing date confirmed','Deposit record verified','Change orders reconciled','Amendment reviewed','Final walkthrough planned','Handover package checked'];
const QUOTE_KEY = 'marchand-sprint1-quotes-v1';
const ISSUE_KEY = 'marchand-sprint1-issues-v1';
const CHECK_KEY = 'marchand-sprint1-closeout-v1';
const uid = () => Math.random().toString(36).slice(2,10);
const csvCell = (v: string | number) => {const raw=String(v);const safe=/^[\s\uFEFF]*[=+@-]/u.test(raw)&&typeof v==='string' ? "'"+raw : raw; return '"'+safe.replaceAll('"','""')+'"';};
const download = (filename:string,content:string,type:string) => {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const a=document.createElement('a'); a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function readSaved<T>(key:string,fallback:T):T {
  try {const raw=localStorage.getItem(key);return raw ? JSON.parse(raw) as T : fallback;}catch{return fallback;}
}
const baseLine=():QuoteLine=>({id:uid(),label:'',qty:1,unit:0});
function demoIssues(homeId:string):Issue[] {
  return [
    {id:'demo-electrical',homeId,title:'Confirm service routing with electrician',priority:'Important',owner:'Scott',done:false},
    {id:'demo-inspection',homeId,title:'Confirm inspection window with site lead',priority:'Normal',owner:'Project manager',done:false}
  ];
}

export function Studio(){
  const {state,role,setRole}=useStore();
  const accessible=canOpenStudio(role);
  const homes=accessible?homesFor(state,role):[];
  const [tab,setTab]=useState<Tab>('decisions');
  const [homeId,setHomeId]=useState('');
  const [quotes,setQuotes]=useState<Record<string,QuoteLine[]>>({});
  const [issues,setIssues]=useState<Issue[]>([]);
  const [checks,setChecks]=useState<Record<string,string[]>>({});
  const [loaded,setLoaded]=useState(false);
  const [storageError,setStorageError]=useState(false);
  const [message,setMessage]=useState('');
  const [issueTitle,setIssueTitle]=useState('');
  const [issuePriority,setIssuePriority]=useState<Issue['priority']>('Important');
  const [issueOwner,setIssueOwner]=useState<Issue['owner']>('Scott');

  useEffect(()=>{
    const next=new URLSearchParams(location.search).get('tab');
    if(TABS.some(t=>t.id===next))setTab(next as Tab);
    setQuotes(readSaved(QUOTE_KEY,{}));
    setIssues(readSaved(ISSUE_KEY,demoIssues('h01')));
    setChecks(readSaved(CHECK_KEY,{}));
    setLoaded(true);
  },[]);
  useEffect(()=>{if(!homeId||!homes.some(h=>h.id===homeId))setHomeId(homes[0]?.id||'');},[homeId,homes]);
  useEffect(()=>{
    if(!loaded)return;
    let ok=false;
    try {
      ok=persistDrafts(window.localStorage,[
        [QUOTE_KEY,JSON.stringify(quotes)],
        [ISSUE_KEY,JSON.stringify(issues)],
        [CHECK_KEY,JSON.stringify(checks)]
      ]);
    } catch { /* storage accessor itself can be blocked */ }
    setStorageError(!ok);
  },[quotes,issues,checks,loaded]);

  const home=homes.find(h=>h.id===homeId)??homes[0];
  const lines=quotes[home?.id]||[];
  const changeOrders=state.changes.filter(c=>c.homeId===home?.id);
  const homeTasks=state.tasks.filter(t=>t.homeId===home?.id && t.status==='open');
  const list=issues.filter(i=>i.homeId===home?.id);
  const checksDone=checks[home?.id]||[];
  const draft=summarizeDraft(lines);
  const validLines=draft.lines;
  const total=draft.subtotal;
  const extraWithTax=draft.total;
  const pending=state.tasks.filter(t=>(t.role==='owner'||t.role==='coo')&&t.status==='open').sort((a,b)=>a.due.localeCompare(b.due));
  const delayed=state.homes.filter(h=>h.behindWeeks>0);
  const pendingChanges=state.changes.filter(c=>c.status==='requested'||c.status==='priced');
  const nextClosings=state.homes.filter(h=>h.closing&&h.closing>=state.today).sort((a,b)=>(a.closing||'').localeCompare(b.closing||'')).slice(0,4);
  const setLines=(next:QuoteLine[])=>{if(home)setQuotes(prev=>({...prev,[home.id]:next}));setMessage('');};
  const edit=(id:string,patch:Partial<QuoteLine>)=>setLines(lines.map(l=>l.id===id?{...l,...patch}:l));
  const goto=(next:Tab)=>{
    setTab(next);
    const url=new URL(location.href);url.searchParams.set('tab',next);
    history.replaceState(history.state,'',url.pathname+url.search);
    setMessage('');
  };
  const copy=async(text:string)=>{
    try{await navigator.clipboard.writeText(text);setMessage('Copied to clipboard');}
    catch{setMessage('Clipboard unavailable. Use Export CSV instead.');}
  };
  const exportQuote=()=>{
    if(!home)return;
    const rows=[
      ['Marchand HQ SAMPLE quote only','','',''],
      ['Lot',home.lot,'Plan',home.plan],
      ['Description','Quantity','Unit price before HST','Line total before HST'],
      ...validLines.map(l=>[l.label,l.qty,l.unit,l.qty*l.unit]),
      ['Subtotal','','',total],['Illustrative HST 14%','','',draft.hst],
      ['Draft extras including HST','','',extraWithTax],
      ['Existing approved home price incl. HST','','',finalPrice(home,state.changes)],
      ['Projected total if draft approved','','',finalPrice(home,state.changes)+extraWithTax],
      ['NOT APPROVED','','','Local demo, not a legal quote']
    ];
    download('marchand-quote-demo.csv','\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
    setMessage('Draft CSV exported');
  };
  const addIssue=()=>{
    if(!home||!issueTitle.trim())return;
    setIssues(prev=>[{id:uid(),homeId:home.id,title:issueTitle.trim().slice(0,160),priority:issuePriority,owner:issueOwner,done:false},...prev]);
    setIssueTitle('');setMessage('Issue added to this browser');
  };

  if(!accessible)return <Page title="Project Studio" sub="Role access">
    <p role="status">Project Studio is available only to Marchand staff roles in this demo. Switch to Jeff or Scott to continue.</p>
    <Link href="/more">Back to More</Link>
  </Page>;

  return <Page title="Project Studio" sub="Jeff + Scott · practical demo tools">
    <div className={s.intro}>
      <div><strong>One home. Every decision connected.</strong><p>Sample projects, quotes and tasks. Drafts save in this browser when storage is available; nothing is sent to Marchand Homes.</p></div>
      <div className={s.lens}>
        <button type="button" onClick={()=>setRole('owner')} className={role==='owner'?s.picked:''}>Jeff</button>
        <button type="button" onClick={()=>setRole('coo')} className={role==='coo'?s.picked:''}>Scott</button>
      </div>
    </div>
    {storageError&&<p role="alert" className={s.explain}>Browser storage is unavailable. Your sample quote, issues and checklist changes are not saved; export the quote before leaving.</p>}
    <nav className={s.tabs} aria-label="Project Studio tools">
      {TABS.map(t=><button type="button" key={t.id} aria-pressed={tab===t.id} className={tab===t.id?s.selected:''} onClick={()=>goto(t.id)}>{t.label}</button>)}
    </nav>
    {tab!=='decisions'&&home&&<label className={s.homeSelect}><span>Working on</span>
      <select aria-label="Choose demo home" value={home.id} onChange={e=>{setHomeId(e.target.value);setMessage('');}}>
        {homes.map(h=><option key={h.id} value={h.id}>Lot {h.lot} · {h.community} · {h.plan}</option>)}
      </select>
      <Link href={'/homes/'+home.id}>Open home ↗</Link>
    </label>}
    {tab==='decisions'&&<div className={s.grid}>
      <section className={s.card}>
        <div className={s.heading}><span>Company exceptions</span><small>Fictional sample data</small></div>
        <div className={s.metrics}>
          <div><strong>{pending.length}</strong><span>Jeff / Scott tasks</span></div>
          <div><strong>{delayed.length}</strong><span>Delayed homes</span></div>
          <div><strong>{pendingChanges.length}</strong><span>Pending changes</span></div>
        </div>
        <div className={s.subhead}>Needs a decision</div>
        {pending.length?pending.slice(0,8).map(t=><div key={t.id} className={s.line}>
          <span className={s.priority}>{t.role==='owner'?'Jeff':'Scott'}</span>
          <div><strong>{t.title}</strong><small>{t.source} · Due {t.due}</small></div>
          <Link href={'/?task='+encodeURIComponent(t.id)} onClick={()=>setRole(t.role)}>Open →</Link>
        </div>):<p className={s.empty}>No outstanding Jeff or Scott demo tasks. Try the guided story from Today.</p>}
      </section>
      <section className={s.card}>
        <div className={s.heading}><span>Project watch</span><small>Cross-home signals</small></div>
        <div className={s.subhead}>Upcoming closings</div>
        {nextClosings.map(h=><div className={s.line} key={h.id}>
          <span className={s.date}>{h.closing?fmtDate(h.closing):'—'}</span>
          <div><strong>Lot {h.lot}</strong><small>{h.community} · {STAGES[h.stage]}</small></div>
          <Link href={'/homes/'+h.id}>Review →</Link>
        </div>)}
        <div className={s.subhead}>Behind schedule</div>
        {delayed.slice(0,5).map(h=><div className={s.line} key={h.id}>
          <span className={s.alert}>{h.behindWeeks} wk</span>
          <div><strong>Lot {h.lot}</strong><small>{h.community} · {STAGES[h.stage]}</small></div>
          <Link href={'/homes/'+h.id}>Review →</Link>
        </div>)}
        <Link className={s.outlineLink} href="/homes">All homes and project filters →</Link>
      </section>
    </div>}
    {tab==='quote'&&home&&<div className={s.grid}>
      <section className={s.card}>
        <div className={s.heading}><span>Quote Studio</span><small>Illustrative · not approved</small></div>
        <p className={s.explain}>Create a proposed extra for this sample home. Existing approved change orders are already in the base total; drafts never change contracts or shared records.</p>
        {lines.map((l,i)=><div className={s.editLine} key={l.id}>
          <label>Description<input aria-label={'Extra description '+(i+1)} value={l.label} maxLength={140} placeholder="e.g. Additional trim package" onChange={e=>edit(l.id,{label:e.target.value})}/></label>
          <label>Qty<input aria-label={'Quantity '+(i+1)} type="number" min="1" step="1" value={l.qty} onChange={e=>edit(l.id,{qty:Math.max(1,Math.min(999,Number(e.target.value)||1))})}/></label>
          <label>Unit price ($, before HST)<input aria-label={'Unit price '+(i+1)} type="number" min="0" step="0.01" value={l.unit} onChange={e=>edit(l.id,{unit:Math.max(0,Math.min(10000000,Number(e.target.value)||0))})}/></label>
          <button type="button" title="Remove line" aria-label={'Remove extra '+(i+1)} onClick={()=>setLines(lines.filter(x=>x.id!==l.id))}>×</button>
        </div>)}
        <div className={s.controls}>
          <button type="button" onClick={()=>setLines([...lines,baseLine()])}>+ Add line</button>
          <button type="button" onClick={()=>setLines([...lines,{...baseLine(),label:'Example electrical upgrade'}])}>+ Example item</button>
        </div>
        <div className={s.controls}>
          <button type="button" className={s.primary} disabled={!validLines.length} onClick={exportQuote}>Export draft CSV</button>
          <button type="button" disabled={!validLines.length} onClick={()=>void copy('SAMPLE QUOTE · Lot '+home.lot+'\n'+validLines.map(l=>l.label+' · '+l.qty+' × '+money(l.unit)).join('\n')+'\nDraft extras incl. HST '+money(extraWithTax)+'\nNOT APPROVED')}>Copy summary</button>
          <button type="button" onClick={()=>{setLines([]);setMessage('Draft lines cleared');}}>Clear draft</button>
        </div>
      </section>
      <aside className={s.card}>
        <div className={s.heading}><span>Estimate inspector</span><small>Auto-calculated</small></div>
        <div className={s.facts}>
          <div><span>Contract price incl. HST</span><strong>{money(home.contractPrice)}</strong></div>
          <div><span>Approved extras incl. HST</span><strong>{money(finalPrice(home,state.changes)-home.contractPrice)}</strong></div>
          <div><span>Existing approved price</span><strong>{money(finalPrice(home,state.changes))}</strong></div>
          <div><span>New draft subtotal</span><strong>{money(total)}</strong></div>
          <div><span>Illustrative NS HST (14%)</span><strong>{money(draft.hst)}</strong></div>
          <div className={s.highlight}><span>Draft extras incl. HST</span><strong>{money(extraWithTax)}</strong></div>
          <div className={s.highlight}><span>Projected if approved</span><strong>{money(finalPrice(home,state.changes)+extraWithTax)}</strong></div>
        </div>
        <p className={s.explain}>Your draft automatically saves only in this browser. Numbers are not supplier pricing or a signed amendment. All amounts are illustrative.</p>
        {changeOrders.length>0&&<><div className={s.subhead}>Change order history</div>
          {changeOrders.map(c=><div key={c.id} className={s.line}><span className={s.date}>#{c.number??'—'}</span><div><strong>{c.title}</strong><small>{c.status}</small></div><span>{c.price!==null?money(c.price):'Unpriced'}</span></div>)}
        </>}
      </aside>
    </div>}
    {tab==='closeout'&&home&&<div className={s.grid}>
      <section className={s.card}>
        <div className={s.heading}><span>Closing readiness</span><small>{checksDone.length}/{CHECKS.length} checked</small></div>
        <div className={s.progress}><i style={{width:((checksDone.length/CHECKS.length)*100)+'%'}}/></div>
        <p className={s.explain}>Review tasks, amendments and documents before closing. Checkboxes are a personal demo review list, not proof that a document exists or is signed.</p>
        {CHECKS.map(name=><label className={s.check} key={name}>
          <input type="checkbox" checked={checksDone.includes(name)} onChange={e=>setChecks(prev=>({...prev,[home.id]:e.target.checked?[...checksDone,name]:checksDone.filter(n=>n!==name)}))}/>
          <span>{name}</span>
        </label>)}
        <div className={s.controls}>
          <button type="button" onClick={()=>{setChecks(prev=>({...prev,[home.id]:[]}));setMessage('Checklist reset');}}>Reset checks</button>
          <button type="button" className={s.primary} onClick={()=>void copy('Marchand HQ SAMPLE closeout · Lot '+home.lot+'\n'+CHECKS.map(c=>(checksDone.includes(c)?'[x] ':'[ ] ')+c).join('\n')+'\nReview only; no signed documents verified.')}>Copy handoff</button>
        </div>
      </section>
      <aside className={s.card}>
        <div className={s.heading}><span>Closing context</span><small>Derived from demo records</small></div>
        <div className={s.facts}>
          <div><span>Closing date</span><strong>{home.closing?fmtDate(home.closing):'Not scheduled'}</strong></div>
          <div><span>Current stage</span><strong>{STAGES[home.stage]}</strong></div>
          <div><span>Outstanding tasks on this lot</span><strong>{homeTasks.length}</strong></div>
          <div><span>Approved change orders</span><strong>{changeOrders.filter(c=>c.status==='approved').length}</strong></div>
          <div><span>Unresolved change orders</span><strong>{changeOrders.filter(c=>c.status==='priced'||c.status==='requested').length}</strong></div>
        </div>
        {homeTasks.slice(0,5).map(t=><div key={t.id} className={s.line}><span className={s.priority}>{t.role}</span><div><strong>{t.title}</strong><small>Due {t.due}</small></div><Link href={'/?task='+t.id} onClick={()=>setRole(t.role)}>Open →</Link></div>)}
        <Link href={'/homes/'+home.id} className={s.outlineLink}>Open project records →</Link>
      </aside>
    </div>}
    {tab==='issues'&&home&&<div className={s.grid}>
      <section className={s.card}>
        <div className={s.heading}><span>Site issue log</span><small>{list.filter(i=>!i.done).length} open</small></div>
        <p className={s.explain}>Create and resolve sample issues to demonstrate Scott's handoffs. Records are stored on this device, not shared across employees.</p>
        <label className={s.full}>Issue or blocker<input maxLength={160} value={issueTitle} placeholder="What needs a decision?" onChange={e=>setIssueTitle(e.target.value)} /></label>
        <div className={s.issueFilters}>
          <label>Priority<select value={issuePriority} onChange={e=>setIssuePriority(e.target.value as Issue['priority'])}><option>Critical</option><option>Important</option><option>Normal</option></select></label>
          <label>Responsible<select value={issueOwner} onChange={e=>setIssueOwner(e.target.value as Issue['owner'])}><option>Scott</option><option>Jeff</option><option>Project manager</option><option>Designer</option></select></label>
        </div>
        <div className={s.controls}><button type="button" className={s.primary} disabled={!issueTitle.trim()} onClick={addIssue}>+ Log issue</button></div>
      </section>
      <section className={s.card}>
        <div className={s.heading}><span>Issue board</span><small>For Lot {home.lot}</small></div>
        {list.length?list.map(issue=><div key={issue.id} className={s.issueRow}>
          <span className={issue.done?s.resolved:issue.priority==='Critical'?s.alert:s.priority}>{issue.done?'Resolved':issue.priority}</span>
          <div><strong style={{textDecoration:issue.done?'line-through':undefined}}>{issue.title}</strong><small>Assigned to {issue.owner}</small></div>
          <button type="button" onClick={()=>setIssues(prev=>prev.map(i=>i.id===issue.id?{...i,done:!i.done}:i))}>{issue.done?'Reopen':'Resolve'}</button>
          <button type="button" title="Delete issue" aria-label={'Delete issue '+issue.title} onClick={()=>setIssues(prev=>prev.filter(i=>i.id!==issue.id))}>×</button>
        </div>):<p className={s.empty}>No issues for this sample lot. Add one to see it in the board.</p>}
      </section>
    </div>}
    {message&&<p className={s.feedback} role="status">{message}</p>}
    <p className={s.footer}>Marchand HQ · V6 Sprint 1 · Sample records only. Role switching is a demonstration, not an authentication or permission system.</p>
  </Page>;
}
