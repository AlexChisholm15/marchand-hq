'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Check, ChevronDown, Ellipsis, FileDiff, House, ListChecks, Search, Wallet } from 'lucide-react';
import s from './shell.module.css';
import { Button, IconButton, List, Row, SearchBox, Sheet, Skeleton } from './ui';
import { Logo } from './Logo';
import { FloatingAsk } from './FloatingAsk';
import { useStore } from '@/lib/store';
import { navFor, roleById, ROLES, canSeeMoney, DEMO_HOME_ID, type NavId } from '@/lib/people';
import { homesFor, STORY } from '@/lib/engine';
import { STAGES } from '@/lib/seed';
import { lotLabel } from '@/lib/format';
import type { RoleId } from '@/lib/types';

const ICONS: Record<NavId, typeof House> = { today: ListChecks, homes: House, changes: FileDiff, money: Wallet, more: Ellipsis };

type ShellApi = { openSearch: () => void; openRoles: () => void };
const ShellCtx = createContext<ShellApi>({ openSearch: () => {}, openRoles: () => {} });

const initials = (name: string) => name.split(' ').map((p) => p[0]).join('').slice(0, 2);

function activeNav(path: string): NavId {
  if (path.startsWith('/homes')) return 'homes';
  if (path.startsWith('/changes')) return 'changes';
  if (path.startsWith('/money')) return 'money';
  if (path.startsWith('/more') || path.startsWith('/studio')) return 'more';
  return 'today';
}

export function Shell({ children }: { children: ReactNode }) {
  const { role, ready, welcomed } = useStore();
  const path = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState(false);
  const [roles, setRoles] = useState(false);
  const nav = navFor(role);
  const on = activeNav(path);

  // A role never sees a screen it has no business on.
  useEffect(() => {
    if (!ready) return;
    if (path.startsWith('/money') && !canSeeMoney(role)) router.replace('/');
    if (role === 'homeowner' && path.startsWith('/homes') && path !== `/homes/${DEMO_HOME_ID}`) router.replace(`/homes/${DEMO_HOME_ID}`);
  }, [ready, role, path, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
        e.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const api = useMemo(() => ({ openSearch: () => setSearch(true), openRoles: () => setRoles(true) }), []);

  return (
    <ShellCtx.Provider value={api}>
      <div className={s.app}>
        <nav className={s.rail} aria-label="Main">
          <div className={s.brand}>
            <Logo size={28} />
            Marchand HQ
          </div>
          {nav.map((n) => {
            const Icon = ICONS[n.id];
            return (
              <Link key={n.id} href={n.href} className={`${s.railItem} ${on === n.id ? s.railOn : ''}`} aria-current={on === n.id ? 'page' : undefined}>
                <Icon size={18} aria-hidden />
                {n.label}
              </Link>
            );
          })}
          <div className={s.railFoot}>Sample data · demo only</div>
        </nav>
        <main className={s.main}>{ready ? children : <Loading />}</main>
        <nav className={s.bottom} aria-label="Main">
          {nav.map((n) => {
            const Icon = ICONS[n.id];
            return (
              <Link key={n.id} href={n.href} className={`${s.navItem} ${on === n.id ? s.navOn : ''}`} aria-current={on === n.id ? 'page' : undefined}>
                <Icon size={22} aria-hidden strokeWidth={on === n.id ? 2.2 : 1.8} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        {ready && <FloatingAsk />}
        <SearchSheet open={search} onClose={() => setSearch(false)} />
        <RoleSheet open={roles} onClose={() => setRoles(false)} />
        {ready && !welcomed && role === 'designer' && <Welcome />}
      </div>
    </ShellCtx.Provider>
  );
}

function Loading() {
  return (
    <div style={{ paddingTop: 72 }} aria-busy="true" aria-label="Loading">
      <Skeleton h={28} />
      <Skeleton h={180} mt={24} />
      <Skeleton h={120} mt={16} />
    </div>
  );
}

export function useShell() {
  return useContext(ShellCtx);
}

export function Page({ title, sub, back, children }: { title: string; sub?: string; back?: string; children: ReactNode }) {
  const { role, guide, story, palette, setPalette } = useStore();
  const { openSearch, openRoles } = useShell();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const r = roleById(role);
  const next = STORY[story];
  return (
    <>
      <header className={`${s.top} ${scrolled ? s.topScrolled : ''}`}>
        {back && (
          <span className={s.back}>
            <IconButton label="Back" onClick={() => (history.length > 1 ? router.back() : router.push(back))}>
              <ArrowLeft size={20} />
            </IconButton>
          </span>
        )}
        <div className={s.topText}>
          <h1 className={s.topTitle}>{title}</h1>
          {sub && <p className={s.topSub}>{sub}</p>}
        </div>
        <div className={s.topActions}>
          <ColourwayPicker palette={palette} setPalette={setPalette}>
              <option value="cobalt">Cobalt</option>
              <option value="copper">Copper</option>
              <option value="forest">Forest</option>
              <option value="plum">Plum</option>
              <option value="slate">Slate</option>
              <option value="rose">Rose</option>
              <option value="marchand63">Marchand 63</option>
              <option value="panther">Panther Red</option>
              <option value="architect">Architect</option>
              <option value="blackgold">Black &amp; Gold</option>
              <option value="coastal">Coastal</option>
              <option value="city">City</option>
          </ColourwayPicker>
          <IconButton label="Search homes and tasks" onClick={openSearch}>
            <Search size={20} />
          </IconButton>
          <button type="button" className={s.roleChip} onClick={openRoles} aria-label={`Viewing as ${r.person}. Switch role`}>
            <span>{r.label}</span>
            <ChevronDown size={16} aria-hidden />
          </button>
        </div>
      </header>
      {guide && next && next.role === role && (
        <div className={s.guide} role="note">
          <span className="num" style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{story + 1}/{STORY.length}</span>
          <span>
            <strong>Demo step:</strong> {next.text}
          </span>
        </div>
      )}
      {children}
    </>
  );
}

// Keep the original option values and store action as the single switching path.
function ColourwayPicker({ palette, setPalette, children }: {
  palette: ReturnType<typeof useStore>['palette'];
  setPalette: ReturnType<typeof useStore>['setPalette'];
  children: ReactNode;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 400 });
  const [label, setLabel] = useState('');
  const options = useRef<HTMLSelectElement>(null);
  useEffect(() => { setLabel(options.current?.selectedOptions[0]?.text ?? palette); }, [palette]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const width = Math.min(208, window.innerWidth - 24);
      setPosition({ top: rect.bottom + 8, left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)), maxHeight: Math.max(80, window.innerHeight - rect.bottom - 20) });
    };
    place();
    menu.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    const outside = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !trigger.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <>
    <select hidden aria-hidden ref={options} value={palette} onChange={e => setPalette(e.target.value as typeof palette)}>{children}</select>
    <button ref={trigger} type="button" className={s.palettePicker} aria-label={`Colourway: ${label || palette}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => setOpen(!open)} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}>
      <span className={s.paletteDot} aria-hidden /><span className={s.paletteLabel}>{label || palette}</span><ChevronDown size={14} aria-hidden />
    </button>
    {open && createPortal(<div ref={menu} id={id} role="listbox" aria-label="Colourway" className={s.paletteMenu} style={position}
      onBlur={e => { if (e.relatedTarget !== trigger.current && !e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
      onKeyDown={e => {
        const items = Array.from(menu.current!.querySelectorAll<HTMLButtonElement>('[role="option"]'));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        let next = index;
        if (e.key === 'Escape') { e.preventDefault(); close(); return; }
        if (e.key === 'Tab') { close(); return; }
        if (e.key === 'ArrowDown') next = (index + 1) % items.length;
        else if (e.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = items.length - 1;
        else if (e.key.length === 1 && /\S/.test(e.key)) {
          const match = items.findIndex((item, i) => i > index && item.textContent?.toLowerCase().startsWith(e.key.toLowerCase()));
          next = match >= 0 ? match : items.findIndex(item => item.textContent?.toLowerCase().startsWith(e.key.toLowerCase()));
        } else return;
        if (next >= 0) { e.preventDefault(); items[next].focus(); }
      }}>
      {Array.from(options.current?.options ?? []).map(option => <button type="button" key={option.value} role="option" aria-selected={option.value === palette} tabIndex={-1} className={s.paletteOption}
        onClick={() => { setPalette(option.value as typeof palette); close(); }}>
        <span>{option.text}</span><Check size={14} aria-hidden style={{ visibility: option.value === palette ? 'visible' : 'hidden' }} />
      </button>)}
    </div>, document.body)}
  </>;
}

function RoleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, setRole, story, guide } = useStore();
  const next = STORY[story];
  const pick = (id: RoleId) => {
    setRole(id);
    onClose();
  };
  return (
    <Sheet open={open} title="View as" onClose={onClose}>
      <div role="list">
        {ROLES.map((r) => (
          <button key={r.id} type="button" role="listitem" className={`${s.roleRow} ${r.id === role ? s.roleOn : ''}`} onClick={() => pick(r.id)}>
            <span className={s.avatar} aria-hidden>{initials(r.person)}</span>
            <span className={s.roleText}>
              <span className={s.roleName} style={{ display: 'block' }}>{r.person}</span>
              <span className={s.roleTitle} style={{ display: 'block' }}>
                {r.title}
                {guide && next?.role === r.id ? ' · next in demo' : ''}
              </span>
            </span>
            {r.id === role && <Check size={18} aria-label="Current" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, role } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');
  useEffect(() => { if (!open) setQ(''); }, [open]);
  const needle = q.trim().toLowerCase();
  const homes = homesFor(state, role);
  const homeHits = needle
    ? homes.filter((h) => `lot ${h.lot} ${h.civic} ${h.street} ${h.community} ${h.plan} ${h.buyer ?? 'spec'}`.toLowerCase().includes(needle)).slice(0, 8)
    : homes.slice(0, 5);
  const taskHits = needle ? state.tasks.filter((t) => t.role === role && t.title.toLowerCase().includes(needle)).slice(0, 5) : [];
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  return (
    <Sheet open={open} title="Search" onClose={onClose}>
      <SearchBox value={q} onChange={setQ} placeholder="Lot, street, buyer or plan" autoFocus />
      <div className={s.results}>
        <div className={s.resultGroup}>{needle ? `Homes (${homeHits.length})` : 'Homes'}</div>
        {homeHits.length ? (
          <List label="Homes">
            {homeHits.map((h) => (
              <Row key={h.id} title={`${lotLabel(h)} · ${h.civic} ${h.street}`} meta={`${h.buyer ?? 'Spec home'} · ${h.plan} · ${STAGES[h.stage]}`} onClick={() => go(`/homes/${h.id}`)} />
            ))}
          </List>
        ) : (
          <p style={{ color: 'var(--text-2)', fontSize: 14, padding: '0 4px' }}>No homes match. Try a lot number or buyer name.</p>
        )}
        {taskHits.length > 0 && (
          <>
            <div className={s.resultGroup}>Your tasks</div>
            <List label="Tasks">
              {taskHits.map((t) => (
                <Row key={t.id} title={t.title} meta={t.source} onClick={() => go(`/?task=${t.id}`)} done={t.status === 'done'} />
              ))}
            </List>
          </>
        )}
      </div>
    </Sheet>
  );
}

function Welcome() {
  const { dismissWelcome, setRole } = useStore();
  const router = useRouter();
  return (
    <Sheet open title="Marchand HQ" onClose={dismissWelcome}>
      <div className={s.welcome}>
        <p className={s.lead}>One place for every home, change and closing. Each person sees their part.</p>
        <p>
          Sample data. Staff are Marchand&apos;s own team. Every buyer, address and dollar figure is made up for this demo.
          Built to learn from you, not to sell to you.
        </p>
        <div className={s.welcomeActions}>
          <Button
            variant="primary"
            block
            data-autofocus
            onClick={() => {
              setRole('designer');
              dismissWelcome();
              router.push('/');
            }}
          >
            Walk through the demo story
          </Button>
          <Button block onClick={dismissWelcome}>
            Look around as Jeff
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
