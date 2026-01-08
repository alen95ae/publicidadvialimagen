/**
 * Utilidades compartidas para el sistema de permisos
 * 
 * Este módulo centraliza la lógica de normalización y permisos por defecto
 * para garantizar consistencia entre API y frontend.
 */

/**
 * Normaliza un nombre de módulo a su clave canónica
 * 
 * Ejemplos:
 * - "Ventas" → "ventas"
 * - "Producción" → "produccion"
 * - "Mantenimiento" → "mantenimiento"
 * 
 * @param modulo - Nombre del módulo en cualquier formato
 * @returns Clave canónica del módulo (sin espacios, sin acentos, minúsculas)
 */
export function normalizarModulo(modulo: string | undefined | null): string {
  if (!modulo) return '';
  
  // Mapeo explícito para módulos con nombres compuestos en BD
  const mapaModulos: Record<string, string> = {
    'panel principal': 'panel',
  };
  
  // Normalizar: eliminar acentos, minúsculas, trim
  let normalizado = modulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  
  // Aplicar mapeo si existe
  if (mapaModulos[normalizado]) {
    return mapaModulos[normalizado];
  }
  
  // Si no está en el mapa, eliminar espacios y guiones bajos
  // Esto maneja casos como "producción" → "produccion", "mantenimiento" → "mantenimiento"
  return normalizado.replace(/[\s_-]+/g, '');
}

/**
 * Normaliza un nombre de acción
 * 
 * IMPORTANTE: Elimina diacríticos (tildes) y convierte a minúsculas
 * para garantizar coincidencia entre BD y código, independientemente
 * de cómo esté almacenado en la base de datos.
 * 
 * Ejemplos:
 * - "modificar precio cotización" → "modificar precio cotizacion"
 * - "Modificar Precio Cotización" → "modificar precio cotizacion"
 * - "modificar precio cotizacion" → "modificar precio cotizacion"
 * 
 * @param accion - Nombre de la acción
 * @returns Acción normalizada (sin tildes, minúsculas, trim, espacios colapsados)
 */
export function normalizarAccion(accion: string | undefined | null): string {
  if (!accion) return '';
  return accion
    .normalize("NFD")              // Descompone caracteres con diacríticos
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (tildes, etc.)
    .trim()
    .replace(/\s+/g, " ")         // Colapsa espacios múltiples
    .toLowerCase();                // Convierte a minúsculas
}

/**
 * Definición de permisos por defecto por rol
 * 
 * Estos permisos se aplican SOLO cuando rol_permisos está vacío.
 * Sirven como fallback para garantizar que usuarios con roles válidos
 * siempre tengan acceso a módulos básicos.
 * 
 * IMPORTANTE: Estos son permisos MÍNIMOS. Los permisos reales deben
 * asignarse en la tabla rol_permisos.
 */
export const PERMISOS_POR_DEFECTO_POR_ROL: Record<string, string[]> = {
  'admin': [
    'mensajes', 'calendario', 'contactos', 'ventas', 'soportes',
    'inventario', 'produccion', 'mantenimiento', 'contabilidad',
    'metricas', 'ajustes'
  ],
  'ventas': ['mensajes', 'calendario', 'contactos', 'ventas', 'soportes'],
  'tecnico': ['mensajes', 'calendario', 'soportes', 'mantenimiento'],
  'produccion': ['mensajes', 'calendario', 'produccion', 'inventario'],
  'empleado': ['mensajes', 'calendario']
};

/**
 * Resuelve los módulos permitidos para un rol
 * 
 * @param rolNombre - Nombre del rol (normalizado a minúsculas)
 * @returns Array de claves de módulos canónicas
 */
export function obtenerModulosPorDefectoPorRol(rolNombre: string): string[] {
  const rolNormalizado = rolNombre.toLowerCase().trim();
  return PERMISOS_POR_DEFECTO_POR_ROL[rolNormalizado] || PERMISOS_POR_DEFECTO_POR_ROL['empleado'];
}

/**
 * Claves canónicas de módulos del sidebar
 * 
 * Esta lista debe coincidir EXACTAMENTE con module.key en:
 * - components/sidebar.tsx
 * - components/erp-modules-grid.tsx
 */
export const MODULOS_SIDEBAR = [
  'mensajes',
  'calendario',
  'contactos',
  'ventas',
  'soportes',
  'inventario',
  'produccion',
  'mantenimiento',
  'contabilidad',
  'metricas',
  'ajustes'
] as const;

export type ModuloKey = typeof MODULOS_SIDEBAR[number];
