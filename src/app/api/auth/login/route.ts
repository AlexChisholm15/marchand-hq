import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, SESSION_SECONDS, createLabSession } from '@/lib/labAuthCrypto';
import { safeReturnPath } from '@/lib/labAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const expected = process.env.MHQ_LAB_PASSWORD_SHA256;
  if (!expected || !/^[0-9a-f]{64}$/i.test(expected)) return NextResponse.json({ error: 'Lab access not configured' }, { status: 503 });
  let body: { password?: unknown; next?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: 'Invalid request' }, { status: 413 });
    body = JSON.parse(raw) as typeof body;
  } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (typeof body.password !== 'string' || body.password.length > 256) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  const supplied = createHash('sha256').update(body.password, 'utf8').digest();
  const wanted = Buffer.from(expected, 'hex');
  if (!timingSafeEqual(supplied, wanted)) return NextResponse.json({ error: 'Incorrect password' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const session = await createLabSession();
  if (!session) return NextResponse.json({ error: 'Lab access not configured' }, { status: 503 });
  const response = NextResponse.json({ ok: true, next: safeReturnPath(typeof body.next === 'string' ? body.next : '/') }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(AUTH_COOKIE, session, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_SECONDS });
  return response;
}
