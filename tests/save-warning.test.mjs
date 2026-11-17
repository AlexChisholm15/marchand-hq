import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('global store failure preserves actions and retry clears the warning', () => {
 const source=readFileSync(new URL('../src/lib/store.tsx',import.meta.url),'utf8');
 const body=source.split('const persist = useCallback(() => {')[1].split('}, [saved]);')[0];
 const saved={events:[{type:'sample-action'}],role:'coo',theme:'dark'};
 let failed=false, blocked=true, stored;
 const ctx=vm.createContext({saved,KEY:'marchand-hq-v6',setSaveFailed:value=>failed=value,localStorage:{setItem:(key,value)=>{if(blocked)throw Error('SecurityError');stored={key,value};}}});
 vm.runInContext(body,ctx);
 assert.equal(failed,true);
 assert.equal(saved.events.length,1);
 blocked=false;
 vm.runInContext(body,ctx);
 assert.equal(failed,false);
 assert.equal(stored.key,'marchand-hq-v6');
 assert.deepEqual(JSON.parse(stored.value),saved);
});
