import { getCategoriaConfig } from './supabaseCategorias'

/**
 * Valida que una categoría existe en la tabla categorias para el módulo y sección dados
 * 
 * REGLA CRÍTICA: No hay fallbacks. Si la categoría no existe, lanza error.
 * Preserva case y acentos exactamente como están en la BD.
 * 
 * @param categoria Nombre de la categoría a validar (preserva case y acentos)
 * @param modulo Módulo (ej: "Inventario"). Por defecto: "Inventario"
 * @param entidad Sección/Entidad (ej: "Productos", "Recursos", "Consumibles"). Requerido.
 * @returns La categoría validada (exactamente como está en la BD)
 * @throws Error si la categoría no existe en la tabla o si falta configuración
 */
export async function validateCategoria(
  categoria: string | null | undefined,
  modulo: string = 'Inventario',
  entidad?: string
): Promise<string> {
  // Si la categoría es null o undefined, lanzar error (no hay valores por defecto)
  if (!categoria || typeof categoria !== 'string' || categoria.trim() === '') {
    throw new Error(
      `Categoría requerida para módulo "${modulo}"${entidad ? ` y entidad "${entidad}"` : ''}. ` +
      `No se permiten valores vacíos ni null.`
    )
  }

  // Si no se proporciona entidad, lanzar error (necesitamos saber dónde validar)
  if (!entidad) {
    throw new Error(
      `Entidad requerida para validar categoría. ` +
      `Debe ser uno de: "Productos", "Recursos", "Consumibles". ` +
      `Ejemplo: validateCategoria(categoria, 'Inventario', 'Productos')`
    )
  }

  // Obtener categorías válidas desde la BD
  const config = await getCategoriaConfig(modulo, entidad)
  
  if (!config) {
    throw new Error(
      `No se encontró configuración de categorías para módulo "${modulo}" y entidad "${entidad}". ` +
      `Asegúrate de que existe una configuración en la tabla categorias.`
    )
  }

  const categoriasValidas = config.categorias || []
  
  // Si no hay categorías configuradas, lanzar error
  if (categoriasValidas.length === 0) {
    throw new Error(
      `No hay categorías configuradas para módulo "${modulo}" y entidad "${entidad}". ` +
      `Por favor, configura las categorías desde el panel de ajustes.`
    )
  }
  
  // Buscar coincidencia exacta (case-sensitive, preserva acentos)
  const categoriaTrimmed = categoria.trim()
  const categoriaExiste = categoriasValidas.includes(categoriaTrimmed)
  
  if (!categoriaExiste) {
    throw new Error(
      `Categoría "${categoriaTrimmed}" no es válida para ${modulo}/${entidad}. ` +
      `Categorías válidas: ${categoriasValidas.join(', ')}`
    )
  }

  // Retornar la categoría exactamente como está en la BD (preserva case y acentos)
  return categoriasValidas.find(c => c === categoriaTrimmed) || categoriaTrimmed
}
