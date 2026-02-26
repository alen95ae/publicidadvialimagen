-- Añadir empresa y sucursal a comprobantes (misma fuente que Contabilización de Facturas: Parámetros de Contabilidad).
-- Referencias a empresas(id) y sucursales(id) por UUID.

ALTER TABLE public.comprobantes
  ADD COLUMN IF NOT EXISTS empresa_uuid UUID NULL REFERENCES public.empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sucursal_id UUID NULL REFERENCES public.sucursales(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.comprobantes.empresa_uuid IS 'UUID de la empresa (Parámetros de Contabilidad).';
COMMENT ON COLUMN public.comprobantes.sucursal_id IS 'UUID de la sucursal (Parámetros de Contabilidad).';
