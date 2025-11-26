// Constantes compartidas para el proyecto

// Unidades de medida válidas para la tabla Recursos
export const UNIDADES_MEDIDA = [
  "m2",
  "kg",
  "m",
  "L",
  "unidad",
  "hora",
  "km"
] as const

// Categorías válidas para la tabla Recursos
export const CATEGORIAS_RECURSOS = [
  "Insumos",
  "Mano de Obra",
  "Suministros"
] as const

// Mantener compatibilidad con código existente
export const UNIDADES_MEDIDA_AIRTABLE = UNIDADES_MEDIDA
export const CATEGORIAS_RECURSOS_AIRTABLE = CATEGORIAS_RECURSOS

