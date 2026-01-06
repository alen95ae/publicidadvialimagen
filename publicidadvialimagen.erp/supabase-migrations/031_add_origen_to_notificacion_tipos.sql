-- ============================================
-- MIGRACIÓN: Agregar campo origen a notificacion_tipos
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Distinguir entre notificaciones de 'evento' (disparadas desde código) y 'cron' (evaluadas por cron)
-- ============================================

-- Agregar columna origen si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notificacion_tipos' 
    AND column_name = 'origen'
  ) THEN
    ALTER TABLE public.notificacion_tipos 
      ADD COLUMN origen TEXT NOT NULL DEFAULT 'evento' 
      CHECK (origen IN ('evento', 'cron'));
    
    -- Actualizar tipos existentes según su naturaleza
    -- Los tipos que se procesan por cron deben tener origen='cron'
    UPDATE public.notificacion_tipos
    SET origen = 'cron'
    WHERE codigo = 'alquiler_proximo_finalizar';
    
    -- El resto son 'evento' por defecto (ya está en DEFAULT)
    
    -- Comentario
    COMMENT ON COLUMN public.notificacion_tipos.origen IS 'Origen de la notificación: evento (disparada desde código) o cron (evaluada por cron job)';
  END IF;
END $$;

