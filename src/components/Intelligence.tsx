'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { homesFor } from '@/lib/engine';
import { canSeeMoney } from '@/lib/people';
import type { Task } from '@/lib/types';

function summarizeTask(t: Task) {
  return { id: t.id, title: t.title, detail: t.detail, due: t.due, source: t.source, homeId: t.homeId };
}

export function Intelligence() {
  const { state, role } = useStore();
  const [expanded, setExpanded] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const visible = useMemo(() => {
    const homes = homesFor(state, role);
    const ids = new Set(homes.map(h => h.id));
    const tasks = state.tasks.filter(t => t.role === role && t.status === 'open')
      .sort((a, b) => a.due.localeCompare(b.due));
    const delays = homes.filter(h => h.behindWeeks > 0);
    const pendingChanges = state.changes.filter(c => ids.has(c.homeId) && (c.status === 'requested' || c.status === 'priced'));
    const upcoming = homes.filter(h => h.closing && h.closing >= state.today).sort((a,b) => (a.closing ?? '').localeCompare(b.closing ?? '')).slice(0, 4);
    return { tasks, delays, pendingChanges, upcoming };
  }, [state, role]);

  const ask = async (value: string) => {
    if (!value.trim() || busy) return;
    setQuestion(value);
    setBusy(true); setError(''); setAnswer('');
    try {
      // Demo-only payload, filtered for current simulated role. Never connect actual business data here.
      const payload = {
        role, question: value.slice(0, 500), today: state.today,
        tasks: visible.tasks.slice(0, 25).map(summarizeTask),
        delays: visible.delays.map(h => ({ id: h.id, lot: h.lot, community: h.community, behindWeeks: h.behindWeeks, closing: h.closing })),
        changes: visible.pendingChanges.map(c => ({ id: c.id, homeId: c.homeId, title: c.title, status: c.status })),
        closings: visible.upcoming.map(h => ({ id: h.id, lot: h.lot, closing: h.closing })),
      };
      const response = await fetch('/api/intelligence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'AI is unavailable');
      setAnswer(json.answer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI is unavailable');
    } finally { setBusy(false); }
  };

  const due = visible.tasks.filter(t => t.due <= state.today);
  const panel: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 18 };
  const muted: React.CSSProperties = { fontSize: 12, color: 'var(--text-2)' };
  return <section style={panel} aria-label="Marchand intelligence">
    <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', textAlign:'left', background:'none', border:0, color:'var(--text)', padding:0, cursor:'pointer' }}>
      <span style={{ display:'flex', alignItems:'center', gap:9, fontWeight:600 }}><Sparkles size={19} style={{ color:'var(--accent-text)' }} /> Marchand Brief <span style={{...muted, fontWeight:400}}>Demo</span></span>
      {expanded ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
    </button>
    {expanded && <>
      <p style={{...muted, margin:'9px 0 15px'}}>Computed from this browser's sample records. Not live Marchand operations.</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(135px,1fr))', gap:9}}>
        {[
          { n:due.length, label:'Due or overdue', hint:'Your role' },
          { n:visible.delays.length, label:'Homes behind', hint:'Visible homes' },
          { n:visible.pendingChanges.length, label:'Changes pending', hint:'Awaiting action' }
        ].map(item => <div key={item.label} style={{background:'var(--surface-2)', borderRadius:10,padding:12}}>
          <strong style={{fontSize:24,fontWeight:600,display:'block'}}>{item.n}</strong>
          <span style={{fontSize:12,display:'block'}}>{item.label}</span>
          <span style={muted}>{item.hint}</span>
        </div>)}
      </div>
      <div style={{marginTop:14}}>
        <strong style={{fontSize:13}}>What needs attention</strong>
        {visible.tasks.length ? visible.tasks.slice(0,3).map(t => <Link key={t.id} href={`/?task=${encodeURIComponent(t.id)}`} style={{display:'block',fontSize:13, padding:'9px 0', borderBottom:'1px solid var(--line)',color:'var(--text)'}}>
          {t.title} <span style={muted}>· Due {t.due}</span>
        </Link>) : <p style={muted}>No open tasks assigned to this role.</p>}
      </div>
      <form onSubmit={e => { e.preventDefault(); void ask(question); }} style={{marginTop:14}}>
        <label htmlFor="marchand-question" style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>Ask Marchand</label>
        <div style={{display:'flex',gap:7}}>
          <input id="marchand-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} placeholder="What needs my attention?" style={{flex:1,minWidth:0,padding:'10px',borderRadius:9,border:'1px solid var(--line-strong)',background:'var(--surface)',color:'var(--text)',fontSize:13}}/>
          <button type="submit" disabled={busy || !question.trim()} style={{border:0,background:'var(--accent)',color:'#fff',borderRadius:9,padding:'0 14px',opacity:busy ? .6 : 1}}>{busy ? 'Thinking' : 'Ask'}</button>
        </div>
        {answer && <div role="status" style={{marginTop:12,fontSize:13,lineHeight:1.6,whiteSpace:'pre-wrap',background:'var(--surface-2)',padding:12,borderRadius:9}}>{answer}</div>}
        {error && <p role="status" style={{...muted,marginTop:9}}>{error}</p>}
        <p style={{...muted,marginTop:8}}>AI requires a configured provider. Read-only. Demo records only. {canSeeMoney(role) ? 'Financial records are not sent.' : 'No internal cost or margin records are sent.'}</p>
      </form>
    </>}
  </section>;
}
