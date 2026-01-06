/**
 * Schemas de validación Zod para endpoints de API
 * Validación server-side robusta para prevenir inyección de datos maliciosos
 */

import { z } from 'zod'

/**
 * Schema para formulario de contacto
 * Acepta tanto formato español como inglés
 */
export const formSubmitSchema = z.preprocess((data: any) => {
  // Preprocesar: convertir todos los valores a strings o mantener null/undefined
  const processed: any = {};
  if (data) {
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === null || value === undefined) {
        processed[key] = value;
      } else {
        processed[key] = String(value);
      }
    });
  }
  return processed;
}, z.object({
  // Campos en español
  nombre: z.string().max(100).optional(),
  email: z.string().optional(),
  telefono: z.string().max(20).optional().nullable(),
  empresa: z.string().max(200).optional().nullable(),
  mensaje: z.string().max(5000).optional(),
  // Campos en inglés (alternativos)
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  message: z.string().max(5000).optional(),
  // Campos adicionales que pueden venir del frontend (ignorados)
  origin: z.string().optional(),
  website: z.string().optional(),
  ts: z.union([z.number(), z.string()]).optional(),
  js: z.string().optional(),
})).refine(
  (data) => {
    const email = (data.email || '').trim();
    if (email === '') return false;
    return z.string().email().safeParse(email).success;
  },
  { message: "El email es obligatorio y debe ser válido", path: ["email"] }
).refine(
  (data) => {
    const mensaje = (data.mensaje || data.message || '').trim();
    // Mensaje es opcional, pero si se envía debe tener al menos 10 caracteres
    if (mensaje.length === 0) return true; // Opcional, permitir vacío
    return mensaje.length >= 10;
  },
  { message: "Si se envía un mensaje, debe tener al menos 10 caracteres", path: ["mensaje"] }
).refine(
  (data) => {
    const nombre = (data.nombre || data.name || '').trim();
    return nombre.length > 0;
  },
  { message: "El nombre es obligatorio", path: ["nombre"] }
).transform((data) => {
  const email = (data.email || '').trim();
  const mensaje = (data.mensaje || data.message || '').trim();
  const nombre = (data.nombre || data.name || '').trim() || 'Sin nombre';
  const telefonoRaw = data.telefono || data.phone;
  const telefono = telefonoRaw ? String(telefonoRaw).trim() : null;
  const empresaRaw = data.empresa || data.company;
  const empresa = empresaRaw ? String(empresaRaw).trim() : null;
  
  return {
    nombre,
    email,
    telefono,
    empresa,
    mensaje,
  };
})

/**
 * Schema para mensajes de contacto
 * Incluye validación anti-spam
 */
export const messagesSchema = z.object({
  // Campos en español
  nombre: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(255).trim(),
  telefono: z.string().max(20).trim().optional().nullable(),
  empresa: z.string().max(200).trim().optional().nullable(),
  mensaje: z.string().min(10).max(5000).trim(),
  // Campos en inglés (alternativos)
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(20).trim().optional().nullable(),
  company: z.string().max(200).trim().optional().nullable(),
  message: z.string().min(10).max(5000).trim().optional(),
  // Campos anti-spam
  website: z.string().optional(), // Honeypot - debe estar vacío
  js: z.string().optional(), // Flag de ejecución JS
  ts: z.number().optional(), // Timestamp
}).refine(
  (data) => data.mensaje || data.message,
  { message: "El mensaje es obligatorio" }
).refine(
  (data) => data.nombre || data.name,
  { message: "El nombre es obligatorio" }
).refine(
  (data) => !data.website || data.website.trim() === '',
  { message: "Solicitud rechazada" }
).transform((data) => ({
  nombre: data.nombre || data.name || '',
  email: data.email,
  telefono: data.telefono || data.phone || null,
  empresa: data.empresa || data.company || null,
  mensaje: data.mensaje || data.message || '',
  website: data.website || '',
  js: data.js || '0',
  ts: data.ts,
}))

/**
 * Schema para solicitudes de cotización
 */
export const solicitudesSchema = z.object({
  empresa: z.string().min(1).max(200).trim(),
  contacto: z.string().min(1).max(100).trim(),
  telefono: z.string().min(1).max(20).trim(),
  email: z.string().email().max(255).trim(),
  comentarios: z.string().max(2000).trim().optional().nullable(),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Fecha debe estar en formato YYYY-MM-DD"
  }),
  mesesAlquiler: z.union([
    z.number().int().min(1).max(120),
    z.string().regex(/^\d+$/).transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(120))
  ]),
  soporte: z.string().min(1).max(100).trim(),
  serviciosAdicionales: z.array(z.string().max(100)).optional().default([]),
})

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z.string().email().max(255).trim(),
  password: z.string().min(8).max(128), // No trim password
})

/**
 * Schema para registro
 */
export const registerSchema = z.object({
  email: z.string().email().max(255).trim(),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
  }),
  name: z.string().min(1).max(100).trim().optional(),
  inviteToken: z.string().max(100).trim().optional(),
})

/**
 * Helper para sanitizar email (ocultar parte del dominio)
 */
export function sanitizeEmailForLog(email: string): string {
  if (!email || !email.includes('@')) return '***@***'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local.substring(0, 2)}***@${domain}`
}

