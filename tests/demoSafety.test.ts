import test from 'node:test';
import assert from 'node:assert/strict';
import { canOpenStudio, persistDrafts, retainTaskSelection } from '../src/lib/demoSafety.ts';

const tasks = [
  { id: 'jeff-1', role: 'owner' },
  { id: 'scott-1', role: 'coo' }
] as const;

test('task deep link survives mount and same-role updates', () => {
  assert.equal(retainTaskSelection('scott-1', 'coo', tasks), 'scott-1');
  assert.equal(retainTaskSelection('scott-1', 'coo', [...tasks]), 'scott-1');
});
test('task selection is cleared if the role cannot access it', () => {
  assert.equal(retainTaskSelection('scott-1', 'owner', tasks), null);
  assert.equal(retainTaskSelection('missing', 'coo', tasks), null);
  assert.equal(retainTaskSelection(null, 'coo', tasks), null);
});
test('Project Studio admits staff roles only', () => {
  for (const role of ['owner','coo','office','pm','designer'] as const) assert.equal(canOpenStudio(role), true);
  for (const role of ['homeowner','realtor'] as const) assert.equal(canOpenStudio(role), false);
});
test('draft persistence reports successful writes', () => {
  const saved = new Map<string,string>();
  assert.equal(persistDrafts({ setItem: (k,v)=>{saved.set(k,v)} },[['quote','1'],['issues','2']]), true);
  assert.equal(saved.get('quote'),'1');
  assert.equal(saved.get('issues'),'2');
});
test('draft persistence exposes blocked storage without throwing', () => {
  assert.equal(persistDrafts({ setItem: ()=>{throw new Error('QuotaExceededError')} },[['quote','1']]), false);
});
