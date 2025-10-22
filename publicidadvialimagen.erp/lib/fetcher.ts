export async function api(input: string, init: RequestInit = {}) {
  const url = input.startsWith('/') ? input : `/${input.replace(/^\/+/, '')}`;
  
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...(init.headers || {}) 
    },
    ...init,
  });

  if (res.status === 401) {
    // Solo redirigir si realmente es sesión inválida
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // 🔹 No redirigir si el error es 404, 500 o HTML
  if (!res.ok && res.status !== 404) {
    console.error('API error:', res.status, res.statusText);
  }
  
  return res;
}
