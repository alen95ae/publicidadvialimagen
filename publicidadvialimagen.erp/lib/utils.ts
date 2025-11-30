import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza un texto removiendo tildes, puntos, espacios extra y convirtiendo a minúsculas
 * Útil para búsquedas flexibles que ignoran acentos, puntos, espacios, etc.
 * Ejemplos:
 * - "Av. De Las Américas" → "av de las americas"
 * - "Cara A" → "cara a"
 * - "Peñarol" → "penarol"
 */
export function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes)
    .replace(/\./g, '') // Remover puntos
    .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
    .trim()
}

/**
 * Compara dos textos ignorando tildes y mayúsculas
 */
export function compareTextIgnoreAccents(text1: string, text2: string): boolean {
  return normalizeText(text1) === normalizeText(text2)
}

/**
 * Verifica si un texto contiene otro, ignorando tildes y mayúsculas
 */
export function includesIgnoreAccents(text: string, search: string): boolean {
  return normalizeText(text).includes(normalizeText(search))
}
