import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/labAuthCrypto';
export async function POST() {
  const response = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
