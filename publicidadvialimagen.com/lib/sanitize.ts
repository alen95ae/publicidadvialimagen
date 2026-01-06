/**
 * Sanitización XSS de inputs de usuario
 * 
 * Neutraliza payloads XSS almacenados antes de guardar en BD.
 * Usa DOMPurify con JSDOM para modo server-side.
 * 
 * Política MUY restrictiva: solo texto plano, sin etiquetas HTML.
 * 
 * NOTA: React escapa por defecto, pero esta sanitización es defensa en profundidad.
 */

import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Crear window object para DOMPurify en modo server
const window = new JSDOM('').window
const purify = DOMPurify(window as unknown as Window)

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

  // Configuración MUY restrictiva: solo texto plano
  const config: DOMPurify.Config = {
    // No permitir ninguna etiqueta HTML
    ALLOWED_TAGS: [],
    // No permitir ningún atributo
    ALLOWED_ATTR: [],
    // Mantener saltos de línea como espacios
    KEEP_CONTENT: true,
    // No permitir data URIs
    ALLOW_DATA_ATTR: false,
    // No permitir URIs peligrosos
    ALLOW_UNKNOWN_PROTOCOLS: false,
  }

  // Sanitizar: elimina todas las etiquetas y devuelve solo el contenido de texto
  const sanitized = purify.sanitize(input, config)

  // Limpiar espacios múltiples y saltos de línea
  return sanitized
    .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
    .replace(/\n+/g, ' ') // Saltos de línea a espacio
    .trim() // Eliminar espacios al inicio y final
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

