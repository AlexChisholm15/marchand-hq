'use client';

import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Search as SearchIcon, X } from 'lucide-react';
import s from './ui.module.css';
import { STAGES } from '@/lib/seed';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  block?: boolean;
};

export function Button({ variant = 'secondary', block, className, ...rest }: BtnProps) {
  return <button type="button" className={cx(s.btn, s[variant], block && s.block, className)} {...rest} />;
}

export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(s.btn, s.icon)} {...rest}>
      {children}
    </button>
  );
}

export type Tone = 'neutral' | 'accent' | 'red' | 'amber' | 'green';

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx(s.pill, tone !== 'neutral' && s[`pill_${tone}`])}>{children}</span>;
}

export function List({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className={s.list} role="list" aria-label={label}>
      {children}
    </div>
  );
}

export function Row(props: {
  title: ReactNode;
  meta?: ReactNode;
  side?: ReactNode;
  sideSub?: ReactNode;
  active?: boolean;
  done?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const body = (
    <>
      <span className={s.rowMain}>
        <span className={s.rowTitle} style={{ display: 'block' }}>{props.title}</span>
        {props.meta && <span className={s.rowMeta} style={{ display: 'block' }}>{props.meta}</span>}
      </span>
      {(props.side || props.sideSub) && (
        <span className={s.rowSide}>
          {props.side}
          {props.sideSub}
        </span>
      )}
      <ChevronRight size={16} className={s.chev} aria-hidden />
    </>
  );
  const cls = cx(s.row, props.active && s.rowActive, props.done && s.rowDone);
  if (props.href) {
    return (
      <a role="listitem" className={cls} href={props.href}>
        {body}
      </a>
    );
  }
  return (
    <button role="listitem" type="button" className={cls} onClick={props.onClick} aria-current={props.active || undefined}>
      {body}
    </button>
  );
}

export const lateClass = s.late;

export function Section(props: {
  title: string;
  count?: number;
  action?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  const id = useId();
  return (
    <section className={s.section} aria-labelledby={id}>
      <div className={s.sectionHead}>
        {props.collapsible ? (
          <button type="button" className={s.toggle} aria-expanded={open} onClick={() => setOpen(!open)} id={id}>
            {props.title}
            {props.count !== undefined && <span className={s.count}>{props.count}</span>}
            <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }} aria-hidden />
          </button>
        ) : (
          <h2 className={s.sectionTitle} id={id}>
            {props.title}
            {props.count !== undefined && <span className={s.count}>{props.count}</span>}
          </h2>
        )}
        {props.action}
      </div>
      {open && props.children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: 'red' | 'amber' | 'green' }) {
  return (
    <div className={s.stat}>
      <div className={s.statLabel}>{label}</div>
      <div className={cx(s.statValue, tone && s[`tone_${tone}`])}>{value}</div>
      {note && <div className={s.statNote}>{note}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={cx(s.tab, value === t.id && s.tabOn)}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Timeline({ stage }: { stage: number }) {
  const shown = STAGES.slice(1);
  const idx = Math.max(0, stage - 1);
  return (
    <div>
      <div className={s.timeline} role="img" aria-label={`Stage ${stage} of ${STAGES.length - 1}: ${STAGES[stage]}`}>
        {shown.map((name, i) => (
          <span key={name} className={cx(s.tick, i < idx && s.tickDone, i === idx && stage > 0 && s.tickNow)} />
        ))}
      </div>
      <div className={s.timelineLabels}>
        <span>{stage === 0 ? 'Not started' : STAGES[stage]}</span>
        <span>{stage === 0 ? 'Permit next' : stage < STAGES.length - 1 ? `Next: ${STAGES[stage + 1]}` : 'Ready to close'}</span>
      </div>
    </div>
  );
}

export function StageList({ stage }: { stage: number }) {
  return (
    <ol className={s.stageList}>
      {STAGES.map((name, i) => (
        <li key={name} className={cx(s.stageItem, i < stage && s.stageDone, i === stage && s.stageNow)}>
          <span className={s.dot} aria-hidden />
          {name}
          {i === stage && <span className="sr-only">(current stage)</span>}
        </li>
      ))}
    </ol>
  );
}

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[data-autofocus], button, input')?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open || !mounted) return null;
  return createPortal(
    <div className={s.scrim} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className={s.grab} aria-hidden />
        <div className={s.sheetHead}>
          <h2 className={s.sheetTitle}>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        <div className={s.sheetBody}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function SearchBox({ value, onChange, placeholder, autoFocus, hint }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean; hint?: boolean }) {
  return (
    <label className={s.searchBox}>
      <SearchIcon size={18} aria-hidden />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        enterKeyHint="search"
      />
      {hint && <span className={s.kbd}>/</span>}
    </label>
  );
}

export function Empty({ title, next, action }: { title: string; next: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <p style={{ color: 'var(--text)', fontWeight: 500 }}>{title}</p>
      <p>{next}</p>
      {action && <div className={s.emptyAction}>{action}</div>}
    </div>
  );
}

export function Skeleton({ h = 60, mt = 0 }: { h?: number; mt?: number }) {
  return <div className={s.skel} style={{ height: h, marginTop: mt }} aria-hidden />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = s.input;
