import test from 'node:test';
import assert from 'node:assert/strict';
import { demoHref, demoStepFromUrl, exitDemoHref, guidedDemoSteps } from '../src/lib/guidedDemo.ts';

test('tour has five role-aware steps in presentation order',()=>{
 const steps=guidedDemoSteps('h03');
 assert.deepEqual(steps.map(x=>x.role),['owner','coo','coo','owner','coo']);
 assert.equal(steps[2].href,'/homes/h03');
 assert.ok(steps[3].href.includes('tab=quote'));
});
test('next and back link to correct routes while retaining query parameters',()=>{
 const steps=guidedDemoSteps('h03');
 assert.equal(demoHref(steps[0].href,0),'/studio?tab=decisions&demo=1&step=1');
 assert.equal(demoHref(steps[1].href,1),'/studio?tab=issues&demo=1&step=2');
 assert.equal(demoHref(steps[2].href,2),'/homes/h03?demo=1&step=3');
});
test('reloading a tour step recovers its exact progress',()=>{
 assert.equal(demoStepFromUrl('?tab=quote&demo=1&step=4'),3);
 assert.equal(demoStepFromUrl('?demo=1&step=1'),0);
 assert.equal(demoStepFromUrl('?demo=1&step=6'),null);
 assert.equal(demoStepFromUrl('?demo=1&step=no'),null);
 assert.equal(demoStepFromUrl('?tab=quote'),null);
});
test('exit removes only guided-tour parameters',()=>{
 assert.equal(exitDemoHref('/studio','?tab=quote&demo=1&step=4'),'/studio?tab=quote');
 assert.equal(exitDemoHref('/homes/h03','?demo=1&step=3'),'/homes/h03');
});
