import { serialize } from 'cookie';

const isProd = process.env.NODE_ENV === 'production';
const domain = process.env.COOKIE_DOMAIN || undefined;

export function createAuthCookie(name: string, token: string, maxAgeSec: number) {
  return serialize(name, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain,
    maxAge: maxAgeSec,
  });
}

export function clearAuthCookie(name: string) {
  return serialize(name, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain,
    maxAge: 0,
  });
}
