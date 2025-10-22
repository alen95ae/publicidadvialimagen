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
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  
  return res;
}
