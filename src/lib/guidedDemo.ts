import type { RoleId } from './types.ts';

export type GuidedDemoStep = { title: string; hint: string; role: RoleId; href: string };

export function guidedDemoSteps(sampleHomeId: string): GuidedDemoStep[] {
  return [
    { title: "Jeff’s decisions", hint: 'Review what needs the owner.', role: 'owner', href: '/studio?tab=decisions' },
    { title: "Scott’s blockers", hint: 'Log or resolve a sample site issue.', role: 'coo', href: '/studio?tab=issues' },
    { title: 'Follow one home', hint: 'Inspect project evidence and history.', role: 'coo', href: '/homes/' + encodeURIComponent(sampleHomeId) },
    { title: 'Build a quote', hint: 'Add a sample line and watch totals update.', role: 'owner', href: '/studio?tab=quote' },
    { title: 'Closing readiness', hint: 'Review the sample handoff checklist.', role: 'coo', href: '/studio?tab=closeout' },
  ];
}

export function demoStepFromUrl(query: string, stepCount = 5): number | null {
  const params = new URLSearchParams(query);
  if (params.get('demo') !== '1') return null;
  const raw = params.get('step');
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number >= 1 && number <= stepCount ? number - 1 : null;
}

export function demoHref(href: string, index: number): string {
  const [pathname, search = ''] = href.split('?');
  const params = new URLSearchParams(search);
  params.set('demo', '1');
  params.set('step', String(index + 1));
  return pathname + '?' + params.toString();
}

export function exitDemoHref(path: string, query: string): string {
  const params = new URLSearchParams(query);
  params.delete('demo');
  params.delete('step');
  const remaining = params.toString();
  return path + (remaining ? '?' + remaining : '');
}
