export function getBaseUrl() {
  // Prioriza variable de entorno en server (para producción)
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL;
  
  // Si está en Vercel, usar la URL de Vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  
  // En producción, usar el dominio de producción
  if (process.env.NODE_ENV === 'production') {
    return 'https://erp.publicidadvialimagen.com';
  }
  
  // Solo en desarrollo local
  return 'http://localhost:3000';
}
