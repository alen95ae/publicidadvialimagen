-- ============================================
-- MIGRACIÓN: Asegurar columna roles_destino
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Añadir columna roles_destino si no existe
-- ============================================

-- Verificar y añadir columna roles_destino si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificaciones'
    AND column_name = 'roles_destino'
  ) THEN
    ALTER TABLE notificaciones
    ADD COLUMN roles_destino TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    
    RAISE NOTICE 'Columna roles_destino añadida';
  ELSE
    RAISE NOTICE 'Columna roles_destino ya existe';
  END IF;
END $$;
