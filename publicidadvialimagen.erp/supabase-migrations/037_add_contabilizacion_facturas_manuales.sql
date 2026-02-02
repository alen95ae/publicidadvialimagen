-- Campos para contabilización de facturas manuales (vínculo con comprobantes).
-- estado_contable: PENDIENTE = pendiente de contabilizar, CONTABILIZADO = ya tiene asiento, ERROR = falló la contabilización.

ALTER TABLE public.facturas_manuales
  ADD COLUMN IF NOT EXISTS estado_contable text NOT NULL DEFAULT 'PENDIENTE',
  ADD COLUMN IF NOT EXISTS fecha_contabilizacion timestamptz NULL,
  ADD COLUMN IF NOT EXISTS comprobante_id integer NULL,
  ADD COLUMN IF NOT EXISTS error_contabilizacion text NULL;

COMMENT ON COLUMN public.facturas_manuales.estado_contable IS 'PENDIENTE | CONTABILIZADO | ERROR';
COMMENT ON COLUMN public.facturas_manuales.fecha_contabilizacion IS 'Fecha/hora en que se contabilizó la factura';
COMMENT ON COLUMN public.facturas_manuales.comprobante_id IS 'ID del comprobante contable generado (tabla comprobantes)';
COMMENT ON COLUMN public.facturas_manuales.error_contabilizacion IS 'Mensaje de error si estado_contable = ERROR';

-- Cuentas por defecto para contabilización automática (ventas). Ajustar en Parametros según plan de cuentas.
INSERT INTO contabilidad_config (key, value, descripcion) VALUES
  ('VENTA_DF_CLIENTE_CUENTA', '112001001', 'Cuenta Clientes para contabilización de ventas (VENTA_DF)'),
  ('VENTA_DF_INGRESO_CUENTA', '411001001', 'Cuenta Ingresos para contabilización de ventas (VENTA_DF)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  descripcion = EXCLUDED.descripcion;
