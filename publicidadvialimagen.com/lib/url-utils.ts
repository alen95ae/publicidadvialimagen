// Función para crear slug SEO-friendly
export function createSlug(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Función para generar URL de billboard
// Nota: El sistema de i18n funciona con contexto, no con rutas separadas
// Por lo tanto, siempre usamos la misma ruta independientemente del idioma
export function getBillboardUrl(billboardName: string, locale: 'es' | 'en' = 'es'): string {
  const slug = createSlug(billboardName)
  return `/vallas-publicitarias/${slug}`
}

// Función para generar URL de billboard por ID (fallback)
export function getBillboardUrlById(billboardId: string, locale: 'es' | 'en' = 'es'): string {
  return `/vallas-publicitarias/${billboardId}`
}
