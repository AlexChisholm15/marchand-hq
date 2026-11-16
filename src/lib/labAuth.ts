export const AUTH_COOKIE = 'mhq_lab_access';
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const AUTH_VERSION = 'v1';

export function authSigningInput(expires: number): string {
  return AUTH_VERSION + '.' + expires;
}
export function validExpiration(expires: number, nowSeconds: number): boolean {
  return Number.isSafeInteger(expires) && expires > nowSeconds && expires <= nowSeconds + SESSION_SECONDS;
}
export function safeReturnPath(input: string | null | undefined): string {
  if (!input || !input.startsWith('/') || input.startsWith('//') || input.includes('\\') || /[\r\n]/.test(input)) return '/';
  if (input.startsWith('/login') || input.startsWith('/api/auth')) return '/';
  return input;
}
