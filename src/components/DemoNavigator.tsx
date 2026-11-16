'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { demoHref, demoStepFromUrl, exitDemoHref, guidedDemoSteps } from '@/lib/guidedDemo';
import s from './demoNavigator.module.css';

export function DemoNavigator() {
  const { state, setRole } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const sample = state.homes.find(h => h.behindWeeks > 0) ?? state.homes[0];
  const steps = guidedDemoSteps(sample?.id ?? 'h01');

  useEffect(() => {
    const sync = () => setActive(demoStepFromUrl(window.location.search, steps.length));
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [path, steps.length]);

  useEffect(() => {
    const start = (event: Event) => {
      const requested = (event as CustomEvent<number>).detail;
      const index = Number.isInteger(requested) && requested >= 0 && requested < steps.length ? requested : 0;
      const step = steps[index];
      setActive(index);
      setRole(step.role);
      router.push(demoHref(step.href, index));
    };
    window.addEventListener('marchand:start-demo', start);
    return () => window.removeEventListener('marchand:start-demo', start);
  }, [router, setRole, steps]);

  const advance = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    const step = steps[index];
    setActive(index);
    setRole(step.role);
    router.push(demoHref(step.href, index));
  };

  const exit = () => {
    setActive(null);
    router.replace(exitDemoHref(window.location.pathname, window.location.search));
  };

  if (active === null) return null;
  const step = steps[active];
  return <aside className={s.coach} aria-label="Five-minute guided demo" data-demo-nav>
    <div className={s.copy}>
      <span className={s.eyebrow}>GUIDED DEMO · {active + 1} OF {steps.length} · {step.role === 'owner' ? 'JEFF' : 'SCOTT'}</span>
      <strong>{step.title}</strong>
      <span className={s.hint}>{step.hint}</span>
    </div>
    <div className={s.actions}>
      <button type="button" aria-label="Previous demo step" className={s.previous} disabled={active === 0} onClick={() => advance(active - 1)}><ArrowLeft size={17}/> <span>Back</span></button>
      <button type="button" className={s.next} onClick={() => active === steps.length - 1 ? exit() : advance(active + 1)}>{active === steps.length - 1 ? 'Finish' : 'Next'} {active === steps.length - 1 ? <Check size={16}/> : <ArrowRight size={16}/>}</button>
      <button type="button" aria-label="Exit demo" className={s.exit} onClick={exit}><X size={18}/></button>
    </div>
  </aside>;
}
