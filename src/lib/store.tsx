'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DemoEvent, RoleId, State } from './types';
import { derive, storyProgress } from './engine';
import { localToday } from './format';

type Theme = 'system' | 'light' | 'dark';
export type Palette = 'cobalt' | 'copper' | 'forest' | 'plum' | 'slate' | 'rose' | 'marchand63' | 'panther' | 'architect' | 'blackgold' | 'coastal' | 'city';
const PALETTES: Palette[] = ['cobalt','copper','forest','plum','slate','rose','marchand63','panther','architect','blackgold','coastal','city'];

type Saved = {
  v: 6;
  events: DemoEvent[];
  role: RoleId;
  theme: Theme;
  palette: Palette;
  whatIf: Record<string, number>;
  guide: boolean;
  welcomed: boolean;
};

const KEY = 'marchand-hq-v6';
const FRESH: Saved = { v: 6, events: [], role: 'owner', theme: 'dark', palette: 'marchand63', whatIf: {}, guide: true, welcomed: false };

type Store = {
  ready: boolean;
  state: State;
  events: DemoEvent[];
  role: RoleId;
  theme: Theme;
  palette: Palette;
  whatIf: Record<string, number>;
  guide: boolean;
  welcomed: boolean;
  story: number;
  dispatch: (e: DemoEvent | DemoEvent[]) => void;
  setRole: (r: RoleId) => void;
  setTheme: (t: Theme) => void;
  setPalette: (p: Palette) => void;
  setWhatIf: (w: Record<string, number>) => void;
  setGuide: (g: boolean) => void;
  dismissWelcome: () => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FRESH;
    const parsed = JSON.parse(raw) as Saved;
    return parsed.v === 6 ? { ...FRESH, ...parsed, palette: PALETTES.includes(parsed.palette) ? parsed.palette : 'cobalt' } : FRESH;
  } catch {
    return FRESH;
  }
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(FRESH);
  const [ready, setReady] = useState(false);
  const [today] = useState(localToday);

  useEffect(() => {
    setSaved(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* storage unavailable: keep in memory */ }
  }, [saved, ready]);

  useEffect(() => {
    applyTheme(saved.theme);
    if (saved.theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => applyTheme('system');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [saved.theme]);

  useEffect(() => { document.documentElement.dataset.palette = saved.palette; }, [saved.palette]);

  const state = useMemo(() => derive(today, saved.events), [today, saved.events]);

  const dispatch = useCallback((e: DemoEvent | DemoEvent[]) => {
    setSaved((p) => ({ ...p, events: [...p.events, ...(Array.isArray(e) ? e : [e])] }));
  }, []);

  const value: Store = {
    ready,
    state,
    events: saved.events,
    role: saved.role,
    theme: saved.theme,
    palette: saved.palette,
    whatIf: saved.whatIf,
    guide: saved.guide,
    welcomed: saved.welcomed,
    story: storyProgress(saved.events) + (storyProgress(saved.events) === 8 && Object.values(saved.whatIf).some((d) => d > 0) ? 1 : 0),
    dispatch,
    setRole: (role) => setSaved((p) => ({ ...p, role })),
    setTheme: (theme) => setSaved((p) => ({ ...p, theme })),
    setPalette: (palette) => setSaved((p) => ({ ...p, palette })),
    setWhatIf: (whatIf) => setSaved((p) => ({ ...p, whatIf })),
    setGuide: (guide) => setSaved((p) => ({ ...p, guide })),
    dismissWelcome: () => setSaved((p) => ({ ...p, welcomed: true })),
    reset: () => setSaved((p) => ({ ...FRESH, theme: p.theme, palette: p.palette, guide: p.guide, welcomed: true })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

