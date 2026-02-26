-- Cuentas contables para venta/compra en productos y recursos (soportes).
-- Usadas al contabilizar facturas: mapeo ítem → cuenta de venta.

-- Productos
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS cuenta_venta VARCHAR(20) DEFAULT '112001001',
  ADD COLUMN IF NOT EXISTS cuenta_compra VARCHAR(20) NULL;

COMMENT ON COLUMN public.productos.cuenta_venta IS 'Código de cuenta contable para ventas (ej. 112001001 ALQUILER DE ESPACIOS POR COBRAR).';
COMMENT ON COLUMN public.productos.cuenta_compra IS 'Código de cuenta contable para compras (uso futuro).';

-- Recursos (soportes)
ALTER TABLE public.recursos
  ADD COLUMN IF NOT EXISTS cuenta_venta VARCHAR(20) DEFAULT '112001001',
  ADD COLUMN IF NOT EXISTS cuenta_compra VARCHAR(20) NULL;

COMMENT ON COLUMN public.recursos.cuenta_venta IS 'Código de cuenta contable para ventas.';
COMMENT ON COLUMN public.recursos.cuenta_compra IS 'Código de cuenta contable para compras (uso futuro).';
