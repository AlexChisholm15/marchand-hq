import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { navFor, ROLES } from '../src/lib/people.ts';

const ROOT = new URL('..', import.meta.url).pathname;

function files(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files(p, out);
    else if (['.ts', '.tsx', '.css', '.json', '.md', '.svg'].includes(extname(p))) out.push(p);
  }
  return out;
}
const app = files(join(ROOT, 'src'));

test('navigation has 5 items or fewer for every role', () => {
  for (const r of ROLES) {
    const nav = navFor(r.id);
    assert.ok(nav.length <= 5, `${r.id} has ${nav.length}`);
    assert.equal(nav[0].id, 'today', 'Today is home for every role');
  }
});

test('Money is visible to Jeff and the office only', () => {
  for (const r of ROLES) {
    const has = navFor(r.id).some((n) => n.id === 'money');
    assert.equal(has, r.id === 'owner' || r.id === 'office', r.id);
  }
});

test('no real customer data patterns anywhere in the app', () => {
  const banned = [
    /mail\.google/i, /@gmail\.com/i, /@marchandhomes\.ca/i, /@chisholmgroup\.ca/i,
    /Celebration Drive/i, /Curtis Drive/i, /Parish Street/i, /Zaffre/i, /Blush Court/i, /Fleetwood/i, /McCabe Lake/i,
    /\b\d{3}[-.]\d{3}[-.]\d{4}\b/, /\bPID\b/,
  ];
  for (const f of app) {
    const text = readFileSync(f, 'utf8');
    for (const re of banned) assert.ok(!re.test(text), `${f.replace(ROOT, '')} matches ${re}`);
  }
});

test('no internal jargon in the interface', () => {
  const ui = app.filter((f) => f.endsWith('.tsx'));
  for (const f of ui) {
    const text = readFileSync(f, 'utf8');
    for (const word of ['Workroom', 'Engine', 'Terminal', 'Intelligence', 'Superhuman']) {
      assert.ok(!new RegExp(`>[^<]*\\b${word}`).test(text), `${f.replace(ROOT, '')} shows "${word}"`);
    }
  }
});

test('the app says it is a demo with sample data', () => {
  const all = app.map((f) => readFileSync(f, 'utf8')).join('\n');
  assert.match(all, /Sample data/);
});

test('one design system: no legacy patch stylesheets', () => {
  const css = app.filter((f) => f.endsWith('.css')).map((f) => f.split('/').pop());
  for (const legacy of ['WorkroomsFix.css', 'adaptive.css', 'UnifiedNav.css', 'AppBrand.css', 'engine.css', 'command.css']) {
    assert.ok(!css.includes(legacy), legacy);
  }
});

test('MH icon is labelled and the install icon route exists', () => {
  const logo = readFileSync(join(ROOT, 'src/components/Logo.tsx'), 'utf8');
  assert.match(logo, /aria-label="Marchand Homes"/);
  assert.ok(existsSync(join(ROOT, 'src/app/icon.svg')));
  assert.ok(existsSync(join(ROOT, 'src/app/manifest.ts')));
});
