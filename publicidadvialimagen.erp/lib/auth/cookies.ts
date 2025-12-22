import { serialize } from 'cookie';

const isProd = process.env.NODE_ENV === 'production';
// En producción de Vercel, NO usar domain para que funcione en el dominio de Vercel
// Solo usar domain si está explícitamente configurado y es necesario
const domain = process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== '' ? process.env.COOKIE_DOMAIN : undefined;

export function createAuthCookie(name: string, token: string, maxAgeSec: number) {
  return serialize(name, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}), // Solo incluir domain si está definido
    maxAge: maxAgeSec,
  });
}

export function clearAuthCookie(name: string) {
  return serialize(name, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}), // Solo incluir domain si está definido
    maxAge: 0,
  });
}
