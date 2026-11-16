import { AUTH_COOKIE, AUTH_VERSION, SESSION_SECONDS, authSigningInput, validExpiration } from './labAuth';

function signingSecret(): string | null {
  const key = process.env.MHQ_LAB_SESSION_KEY;
  return key && /^[0-9a-f]{64}$/i.test(key) ? key : null;
}
function hexToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}
function asHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function sign(text: string): Promise<string | null> {
  const secret = signingSecret();
  if (!secret) return null;
  const key = await crypto.subtle.importKey('raw', hexToBytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return asHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))));
}
export async function createLabSession(now = Date.now()): Promise<string | null> {
  const expires = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = authSigningInput(expires);
  const signature = await sign(payload);
  return signature ? payload + '.' + signature : null;
}
export async function verifyLabSession(cookie: string | undefined, now = Date.now()): Promise<boolean> {
  if (!cookie) return false;
  const parts = cookie.split('.');
  if (parts.length !== 3 || parts[0] !== AUTH_VERSION || !/^\d{10,12}$/.test(parts[1]) || !/^[0-9a-f]{64}$/.test(parts[2])) return false;
  const expires = Number(parts[1]);
  if (!validExpiration(expires, Math.floor(now / 1000))) return false;
  const expected = await sign(authSigningInput(expires));
  if (!expected) return false;
  const a = hexToBytes(expected);
  const b = hexToBytes(parts[2]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
export { AUTH_COOKIE, SESSION_SECONDS };
