-- Migración: Crear tabla historial_stock
-- Esta tabla registra todos los movimientos de stock de forma inmutable

CREATE TABLE IF NOT EXISTS historial_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  origen TEXT NOT NULL CHECK (origen IN ('registro_manual', 'cotizacion_aprobada', 'cotizacion_rechazada', 'cotizacion_editada')),
  referencia_id UUID,
  referencia_codigo TEXT,
  item_tipo TEXT NOT NULL CHECK (item_tipo IN ('Recurso', 'Consumible')),
  item_id UUID NOT NULL,
  item_codigo TEXT NOT NULL,
  item_nombre TEXT NOT NULL,
  sucursal TEXT NOT NULL,
  formato JSONB,
  cantidad_udm NUMERIC(10, 2) NOT NULL,
  unidad_medida TEXT NOT NULL,
  impacto TEXT NOT NULL CHECK (impacto IN ('+', '-')),
  stock_anterior NUMERIC(10, 2) NOT NULL,
  stock_nuevo NUMERIC(10, 2) NOT NULL,
  tipo_movimiento TEXT,
  observaciones TEXT,
  usuario_id UUID,
  usuario_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_historial_stock_fecha ON historial_stock(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_historial_stock_item_id ON historial_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_historial_stock_item_tipo ON historial_stock(item_tipo);
CREATE INDEX IF NOT EXISTS idx_historial_stock_origen ON historial_stock(origen);
CREATE INDEX IF NOT EXISTS idx_historial_stock_referencia_id ON historial_stock(referencia_id);
CREATE INDEX IF NOT EXISTS idx_historial_stock_sucursal ON historial_stock(sucursal);

-- Comentarios
COMMENT ON TABLE historial_stock IS 'Historial inmutable de todos los movimientos de stock';
COMMENT ON COLUMN historial_stock.origen IS 'Origen del movimiento: registro_manual, cotizacion_aprobada, cotizacion_rechazada, cotizacion_editada';
COMMENT ON COLUMN historial_stock.referencia_id IS 'ID de la referencia (cotización, etc.)';
COMMENT ON COLUMN historial_stock.referencia_codigo IS 'Código de la referencia (ej: COT-001)';
COMMENT ON COLUMN historial_stock.item_tipo IS 'Tipo de ítem: Recurso o Consumible';
COMMENT ON COLUMN historial_stock.formato IS 'Snapshot del formato usado (JSONB)';
COMMENT ON COLUMN historial_stock.impacto IS 'Impacto: + (suma) o - (resta)';
COMMENT ON COLUMN historial_stock.tipo_movimiento IS 'Tipo: Compra, Consumo, Desecho, Ajuste, Venta, Reversión venta';

-- Habilitar Row Level Security (RLS)
ALTER TABLE historial_stock ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Permitir lectura a usuarios autenticados"
  ON historial_stock FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción a usuarios autenticados"
  ON historial_stock FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- NO permitir actualización ni eliminación (historial inmutable)
CREATE POLICY "Prohibir actualización de historial"
  ON historial_stock FOR UPDATE
  USING (false);

CREATE POLICY "Prohibir eliminación de historial"
  ON historial_stock FOR DELETE
  USING (false);
