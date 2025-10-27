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

// Función para generar URL de billboard con idioma correcto
export function getBillboardUrl(billboardName: string, locale: 'es' | 'en' = 'es'): string {
  const slug = createSlug(billboardName)
  const basePath = locale === 'en' ? '/en/billboards' : '/vallas-publicitarias'
  return `${basePath}/${slug}`
}

// Función para generar URL de billboard por ID (fallback)
export function getBillboardUrlById(billboardId: string, locale: 'es' | 'en' = 'es'): string {
  const basePath = locale === 'en' ? '/en/billboards' : '/vallas-publicitarias'
  return `${basePath}/${billboardId}`
}
