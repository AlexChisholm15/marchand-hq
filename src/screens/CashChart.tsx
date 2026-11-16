'use client';

import { useEffect, useRef, useState } from 'react';
import type { Forecast } from '@/lib/finance';
import { fmtDate, moneyShort } from '@/lib/format';

export function CashChart({ f, base, opening, reserve }: { f: Forecast; base: Forecast | null; opening: number; reserve: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = w < 500 ? 200 : 240;
  const pad = { l: 48, r: 12, t: 16, b: 26 };
  const series = [opening, ...f.weeks.map((x) => x.cash)];
  const baseSeries = base ? [opening, ...base.weeks.map((x) => x.cash)] : null;
  const vals = [...series, ...(baseSeries ?? []), reserve, 0];
  const max = Math.max(...vals) * 1.08;
  const min = Math.min(...vals, 0);
  const x = (i: number) => pad.l + (i / (series.length - 1)) * (w - pad.l - pad.r);
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * (h - pad.t - pad.b);
  const path = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const breachIdx = f.breach ? f.breach.index + 1 : -1;
  const lowIdx = f.lowest.index + 1;
  const ticks = [max * 0.92, (max + min) / 2, Math.max(min, 0)].map((v) => Math.round(v / 100_000) * 100_000);
  const labelEvery = w < 500 ? 4 : 2;

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={h} role="img" aria-label={`Cash forecast for 13 weeks. Lowest ${moneyShort(f.lowest.cash)} in the week of ${fmtDate(f.lowest.start)}. ${f.breach ? `First drop below the reserve floor in the week of ${fmtDate(f.breach.start)}.` : 'Stays above the reserve floor.'}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="var(--text-3)">{moneyShort(t)}</text>
          </g>
        ))}
        {min < 0 && <line x1={pad.l} x2={w - pad.r} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" />}
        <line x1={pad.l} x2={w - pad.r} y1={y(reserve)} y2={y(reserve)} stroke="var(--red)" strokeDasharray="5 4" strokeWidth="1.5" />
        {baseSeries && <path d={path(baseSeries)} fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeDasharray="2 3" />}
        <path d={path(series)} fill="none" stroke="var(--accent)" strokeWidth="2.25" strokeLinejoin="round" style={{ transition: 'd 180ms' }} />
        {series.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === breachIdx || i === lowIdx ? 4.5 : 2.5} fill={i === breachIdx ? 'var(--red)' : i === lowIdx ? 'var(--accent)' : 'var(--surface)'} stroke={i === breachIdx ? 'var(--red)' : 'var(--accent)'} strokeWidth="1.5" />
        ))}
        {series.map((_, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={h - 6} textAnchor="middle" fontSize="12" fill="var(--text-3)">
              {i === 0 ? 'Now' : fmtDate(f.weeks[i - 1].start)}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
}
