-- Añadir columna cotizacion_id (UUID) para vincular la factura manual con la cotización (documento).
-- La columna existente "cotizacion" es numeric(12,4) y se mantiene para compatibilidad (valor numérico, p. ej. tipo de cambio antiguo).

ALTER TABLE public.facturas_manuales
  ADD COLUMN IF NOT EXISTS cotizacion_id uuid NULL;

COMMENT ON COLUMN public.facturas_manuales.cotizacion_id IS 'UUID de la cotización vinculada (documento de cotización). La columna cotizacion es numérica.';
