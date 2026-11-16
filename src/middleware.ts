import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, verifyLabSession } from './lib/labAuthCrypto';

const PUBLIC = ['/login', '/api/auth/login', '/api/auth/logout'];
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (await verifyLabSession(request.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Lab access required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  const login = request.nextUrl.clone();
  login.pathname = '/login';
  login.search = '';
  const requestedPath = pathname + search;
  if (requestedPath.length < 1500) login.searchParams.set('next', requestedPath);
  const response = NextResponse.redirect(login);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-touch-icon.png|manifest.webmanifest|robots.txt|sitemap.xml).*)'],
};
