-- ============================================
-- MIGRACIÓN: Crear índices optimizados
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Optimizar queries de notificaciones
-- ============================================

-- Índice GIN para búsqueda en arrays (roles_destino)
CREATE INDEX IF NOT EXISTS idx_notificaciones_roles_destino_gin
ON notificaciones USING GIN(roles_destino);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at_desc
ON notificaciones(created_at DESC);

-- Índice compuesto para búsqueda por entidad
CREATE INDEX IF NOT EXISTS idx_notificaciones_entidad
ON notificaciones(entidad_tipo, entidad_id)
WHERE entidad_tipo IS NOT NULL AND entidad_id IS NOT NULL;
