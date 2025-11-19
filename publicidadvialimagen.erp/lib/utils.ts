import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza un texto removiendo tildes y convirtiendo a minúsculas
 * Útil para búsquedas que ignoran tildes (ej: "cívica" = "civica")
 */
export function normalizeText(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes)
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
