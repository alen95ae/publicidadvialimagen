export async function api(input: string, init: RequestInit = {}) {
  const url = input.startsWith('/') ? input : `/${input.replace(/^\/+/, '')}`;
  
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...(init.headers || {}) 
    },
  });

  // 👇 Solo 401 implica sesión inválida → login
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // 404/500 no son motivo para expulsar: log y continua
  if (!res.ok) {
    console.error('[API ERROR]', res.status, url);
  }
  
  return res;
}
