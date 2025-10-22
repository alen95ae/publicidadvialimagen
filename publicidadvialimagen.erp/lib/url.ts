export function getBaseUrl() {
  // Prioriza variable de entorno en server
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL;
  
  // Fallbacks de desarrollo
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  
  // Solo en desarrollo local
  return 'http://localhost:3000';
}
