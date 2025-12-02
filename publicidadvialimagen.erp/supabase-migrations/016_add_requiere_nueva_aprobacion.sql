-- Migración: Añadir campo requiere_nueva_aprobacion a cotizacion
-- Este campo indica si una cotización aprobada fue editada y requiere nueva aprobación

ALTER TABLE cotizacion 
ADD COLUMN IF NOT EXISTS requiere_nueva_aprobacion BOOLEAN DEFAULT false;

-- Crear índice para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_cotizacion_requiere_nueva_aprobacion 
ON cotizacion(requiere_nueva_aprobacion) 
WHERE requiere_nueva_aprobacion = true;

-- Comentario
COMMENT ON COLUMN cotizacion.requiere_nueva_aprobacion IS 'Indica si una cotización aprobada fue editada y requiere nueva aprobación para regenerar alquileres';

