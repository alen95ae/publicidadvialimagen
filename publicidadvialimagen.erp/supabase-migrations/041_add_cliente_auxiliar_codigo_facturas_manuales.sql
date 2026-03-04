-- Código del auxiliar (cliente) vinculado a la factura manual.
-- Se usa en contabilización para asignar auxiliar a las líneas de cuenta 1.x y 4.x.
ALTER TABLE public.facturas_manuales
  ADD COLUMN IF NOT EXISTS cliente_auxiliar_codigo text;

COMMENT ON COLUMN public.facturas_manuales.cliente_auxiliar_codigo IS 'Código del auxiliar tipo Cliente vinculado al cliente de la factura; usado al contabilizar.';
