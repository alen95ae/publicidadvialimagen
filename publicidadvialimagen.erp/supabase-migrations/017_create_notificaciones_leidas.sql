-- ============================================
-- MIGRACIÓN: Crear tabla notificaciones_leidas
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Crear tabla para tracking de notificaciones leídas por usuario
-- ============================================

CREATE TABLE IF NOT EXISTS notificaciones_leidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  leida BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notificacion_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_leidas_user 
ON notificaciones_leidas(user_id);

CREATE INDEX IF NOT EXISTS idx_notificaciones_leidas_notificacion 
ON notificaciones_leidas(notificacion_id);
