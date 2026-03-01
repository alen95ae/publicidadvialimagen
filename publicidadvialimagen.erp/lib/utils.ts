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

// --- Fechas en zona horaria Bolivia (America/La_Paz, UTC-4) ---
const ZONA_BOLIVIA = "America/La_Paz"
const LOCALE_BOLIVIA = "es-BO"

/**
 * Formatea una fecha en zona horaria Bolivia (solo fecha, ej. 20/5/2024).
 * Acepta string ISO o Date. Devuelve "" si la fecha es inválida.
 */
export function formatDateBolivia(dateInput: string | Date | null | undefined): string {
  if (dateInput == null) return ""
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString(LOCALE_BOLIVIA, { timeZone: ZONA_BOLIVIA })
}

/**
 * Formatea fecha y hora en zona horaria Bolivia.
 */
export function formatDateTimeBolivia(dateInput: string | Date | null | undefined): string {
  if (dateInput == null) return ""
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString(LOCALE_BOLIVIA, {
    timeZone: ZONA_BOLIVIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Fecha "hoy" en Bolivia (para PDFs, encabezados, etc.).
 */
export function todayBolivia(): string {
  return new Date().toLocaleDateString(LOCALE_BOLIVIA, { timeZone: ZONA_BOLIVIA })
}
