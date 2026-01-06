-- ============================================
-- MIGRACIÓN: Agregar campo deleted_at a tabla leads
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Permitir soft delete de leads (mover a papelera)
-- ============================================

-- Agregar columna deleted_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE leads 
      ADD COLUMN deleted_at TIMESTAMPTZ NULL;
    
    -- Crear índice para mejorar el rendimiento de las consultas
    CREATE INDEX IF NOT EXISTS idx_leads_deleted_at 
    ON leads(deleted_at) 
    WHERE deleted_at IS NOT NULL;
    
    -- Comentario en la columna
    COMMENT ON COLUMN leads.deleted_at IS 'Fecha de eliminación (soft delete). NULL = activo, NOT NULL = eliminado';
  END IF;
END $$;

