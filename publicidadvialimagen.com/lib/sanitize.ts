/**
 * Sanitización XSS de inputs de usuario
 * 
 * Neutraliza payloads XSS almacenados antes de guardar en BD.
 * 
 * Política MUY restrictiva: solo texto plano, sin etiquetas HTML.
 * 
 * NOTA: React escapa por defecto, pero esta sanitización es defensa en profundidad.
 * 
 * IMPLEMENTACIÓN: Usa regex simple para eliminar HTML, sin dependencias de DOM.
 * Esto evita problemas de compatibilidad ESM/CommonJS en producción (Vercel).
 */

/**
 * Sanitiza texto de usuario eliminando HTML y atributos peligrosos
 * 
 * @param input - Texto a sanitizar
 * @returns Texto plano seguro sin HTML
 * 
 * @example
 * sanitizeText("<script>alert(1)</script> Hola <b>mundo</b>")
 * // Returns: "alert(1) Hola mundo"
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Paso 1: Eliminar todas las etiquetas HTML (incluyendo script, style, etc.)
  // Esta regex captura cualquier etiqueta HTML, incluyendo atributos
  let sanitized = input.replace(/<[^>]*>/g, '')

  // Paso 2: Eliminar entidades HTML codificadas comunes
  // Decodificar entidades básicas para mantener legibilidad
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Paso 3: Eliminar cualquier intento de inyección de JavaScript
  // Eliminar patrones comunes de XSS
  sanitized = sanitized
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '') // Eliminar event handlers (onclick, onerror, etc.)
    .replace(/data:/gi, '') // Eliminar data URIs potencialmente peligrosos

  // Paso 4: Limpiar espacios múltiples y saltos de línea
  sanitized = sanitized
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/\n+/g, ' ') // Saltos de línea a espacio
    .replace(/\r+/g, ' ') // Retornos de carro a espacio
    .replace(/\t+/g, ' ') // Tabs a espacio
    .trim() // Eliminar espacios al inicio y final

  return sanitized
}

/**
 * Sanitiza múltiples campos de texto de un objeto
 * 
 * @param data - Objeto con campos a sanitizar
 * @param fields - Array de nombres de campos a sanitizar
 * @returns Objeto con campos sanitizados
 */
export function sanitizeFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...data }
  
  for (const field of fields) {
    if (field in sanitized && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field]) as T[keyof T]
    }
  }
  
  return sanitized
}

