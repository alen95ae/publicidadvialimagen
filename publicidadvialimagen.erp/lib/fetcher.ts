export async function api(input: string, init: RequestInit = {}) {
  const url = input.startsWith('/') ? input : `/${input.replace(/^\/+/, '')}`;
  
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...(init.headers || {}) 
    },
    cache: init.cache ?? 'no-store',
  });

  // 🚫 Solo 401 implica sesión inválida → logout + redirect
  if (res.status === 401) {
    console.warn("[401] Unauthorized en", url, "- Ejecutando logout");
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      console.log("✅ Logout ejecutado correctamente");
    } catch (error) {
      console.error("❌ Error ejecutando logout:", error);
    }
    if (typeof window !== 'undefined') {
      console.log("🔄 Redirigiendo a login");
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  // 404/500/HTML/RSC: NO logout. Log para diagnóstico, pero seguimos.
  if (!res.ok) {
    console.error('[API ERROR]', res.status, url);
  }
  
  return res;
}
