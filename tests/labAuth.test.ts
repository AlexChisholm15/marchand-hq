import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_COOKIE, SESSION_SECONDS, authSigningInput, safeReturnPath, validExpiration } from '../src/lib/labAuth.ts';
import { readFileSync } from 'node:fs';
const read=(p:string)=>readFileSync(new URL(p, import.meta.url),'utf8');

test('private lab session has finite expiry and its own cookie',()=>{
  assert.equal(AUTH_COOKIE,'mhq_lab_access');
  assert.equal(SESSION_SECONDS,604800);
  assert.equal(authSigningInput(1234),'v1.1234');
  assert.equal(validExpiration(1100,1000),true);
  assert.equal(validExpiration(999,1000),false);
  assert.equal(validExpiration(1000+SESSION_SECONDS+1,1000),false);
});
test('login destination denies off-site redirects and login recursion',()=>{
  for(const x of ['https://example.com','//example.com','/\\example.com','/login?next=/','/api/auth/login',''])assert.equal(safeReturnPath(x),'/');
  assert.equal(safeReturnPath('/studio?tab=quote&demo=1'),'/studio?tab=quote&demo=1');
});
test('middleware gates every app and API route without any client-side password check',()=>{
  const source=read('../src/middleware.ts');
  assert.match(source,/verifyLabSession/);
  assert.match(source,/status: 401/);
  assert.match(source,/login\.pathname = '\/login'/);
  assert.match(source,/Cache-Control/);
});
test('session cookie is httpOnly secure with finite lifetime; secret remains server-side',()=>{
  const login=read('../src/app/api/auth/login/route.ts');
  assert.match(login,/timingSafeEqual/);
  assert.match(login,/MHQ_LAB_PASSWORD_SHA256/);
  assert.match(login,/httpOnly: true, secure: true, sameSite: 'lax'/);
  assert.match(login,/maxAge: SESSION_SECONDS/);
  const crypto=read('../src/lib/labAuthCrypto.ts');
  assert.match(crypto,/MHQ_LAB_SESSION_KEY/);
  assert.match(crypto,/HMAC/);
  assert.match(crypto,/validExpiration/);
  assert.doesNotMatch(read('../src/app/login/page.tsx'),/MHQ_LAB_PASSWORD_SHA256|MHQ_LAB_SESSION_KEY/);
});
