import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizeDraft } from '../src/lib/quoteDraft.ts';
const read=(p:string)=>readFileSync(new URL(p,import.meta.url),'utf8');

test('quote draft calculates HST and does not include empty lines',()=>{
  const s=summarizeDraft([
    {id:'a',label:'Example extra',qty:2,unit:125.50},
    {id:'b',label:'',qty:1,unit:1000},
    {id:'c',label:'Electrical work',qty:1,unit:20}
  ]);
  assert.equal(s.subtotal,271);assert.equal(s.hst,37.94);assert.equal(s.total,308.94);assert.equal(s.lines.length,2);
});
test('quote draft excludes invalid/negative or infinite prices',()=>{
 const s=summarizeDraft([{id:'a',label:'Unsafe price',qty:1,unit:-100},{id:'b',label:'Infinite',qty:1,unit:Infinity},{id:'c',label:'Zero quote',qty:1,unit:0}]);
 assert.equal(s.lines.length,1);assert.equal(s.total,0);
});
test('quote maths rejects invalid rates and rounds at cents',()=>{
 assert.throws(()=>summarizeDraft([],2));
 const s=summarizeDraft([{id:'a',label:'Test',qty:1,unit:10.01}]);
 assert.equal(s.subtotal,10.01);assert.equal(s.hst,1.40);assert.equal(s.total,11.41);
});
test('standard Today dashboard retains task detail and brief',()=>{
 const source=read('../src/screens/Today.tsx');
 assert.match(source,/<DemoRoute \/>/);assert.match(source,/<OpsBrief \/>/);assert.match(source,/<TaskDetail task=/);
});
test('Studio exposes four functional workspaces',()=>{
 const src=read('../src/screens/Studio.tsx');
 for(const name of ['Decision desk','Quote Studio','Closing desk','Site issues'])assert.ok(src.includes(name));
 for(const fn of ['setIssues(','setChecks(','setLines(','exportQuote','persistDrafts('])assert.ok(src.includes(fn));
 assert.match(src,/nothing is sent to Marchand Homes/);
});
test('all 12 colourways remain available',()=>{
 const store=read('../src/lib/store.tsx'),nav=read('../src/components/Shell.tsx'),css=read('../src/styles/globals.css');
 for(const name of ['cobalt','copper','forest','plum','slate','rose','marchand63','panther','architect','blackgold','coastal','city']){
  assert.ok(store.includes("'"+name+"'"));assert.ok(nav.includes('value="'+name+'"'));assert.ok(css.includes("data-palette='"+name+"'"));
 }
});
test('new tools link from existing More and demo tour',()=>{
 const more=read('../src/screens/More.tsx'),demo=read('../src/components/DemoRoute.tsx');
 for(const name of ['tab=decisions','tab=quote','tab=closeout','tab=issues'])assert.ok(more.includes(name));
 assert.match(demo,/Jeff’s decisions/);assert.match(demo,/Scott’s blockers/);
});
test('private email records not imported into project studio',()=>{
 const files=[read('../src/screens/Studio.tsx'),read('../src/components/DemoRoute.tsx')].join('\n');
 assert.doesNotMatch(files,/Mourtzanos|Chisholm|Gmail|@marchandhomes\.ca|Curtis Drive|Celebration Drive/i);
});
