'use client';

import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import { DEMO_INSIGHTS, type DemoInsightKey } from '@/lib/demoInsights';
import { demoStepFromUrl } from '@/lib/guidedDemo';
import s from './demoInsight.module.css';

export function DemoInsightTag({ topic }: { topic: DemoInsightKey }) {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const close = useRef<HTMLButtonElement>(null);
  const insight = DEMO_INSIGHTS[topic];

  useEffect(() => {
    const sync = () => {
      const isActive = demoStepFromUrl(window.location.search) === insight.step - 1;
      setActive(isActive);
      if (!isActive) setOpen(false);
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('marchand:demo-route', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('marchand:demo-route', sync);
    };
  }, [insight.step]);

  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open]);

  if (!active) return null;
  return <>
    <button type="button" className={s.tag} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={'Demo insight: ' + insight.title}><Info size={12} aria-hidden/> Demo</button>
    {open && <div className={s.overlay} onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className={s.modal} role="dialog" aria-modal="true" aria-label={insight.title}>
        <div className={s.header}><span>WHY THIS MATTERS · SAMPLE DATA</span><button ref={close} type="button" aria-label="Close demo insight" onClick={() => setOpen(false)}><X size={19}/></button></div>
        <h2>{insight.title}</h2>
        <p className={s.lead}>{insight.point}</p>
        <div className={s.section}><strong>What you’re seeing</strong><p>{insight.present}</p></div>
        <div className={s.section}><strong>What connected Marchand HQ could unlock</strong><p>{insight.potential}</p></div>
        <p className={s.disclosure}>Conceptual capabilities are not currently connected to live Marchand records.</p>
        <button className={s.done} type="button" onClick={() => setOpen(false)}>Back to demo</button>
      </section>
    </div>}
  </>;
}
