-- Migración: Crear tabla de cotizaciones
-- Esta migración crea la tabla de cotizaciones con todos los campos necesarios

CREATE TABLE IF NOT EXISTS cotizacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  cliente TEXT,
  vendedor TEXT,
  sucursal TEXT,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Aprobada', 'Rechazada')),
  subtotal NUMERIC(12, 2) DEFAULT 0,
  total_iva NUMERIC(12, 2) DEFAULT 0,
  total_it NUMERIC(12, 2) DEFAULT 0,
  total_final NUMERIC(12, 2) DEFAULT 0,
  vigencia INTEGER DEFAULT 30,
  cantidad_items INTEGER DEFAULT 0,
  lineas_cotizacion INTEGER DEFAULT 0,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_cotizacion_codigo ON cotizacion(codigo);
CREATE INDEX IF NOT EXISTS idx_cotizacion_estado ON cotizacion(estado);
CREATE INDEX IF NOT EXISTS idx_cotizacion_cliente ON cotizacion(cliente);
CREATE INDEX IF NOT EXISTS idx_cotizacion_vendedor ON cotizacion(vendedor);
CREATE INDEX IF NOT EXISTS idx_cotizacion_fecha_creacion ON cotizacion(fecha_creacion DESC);

-- Comentarios en las columnas
COMMENT ON TABLE cotizacion IS 'Tabla de cotizaciones';
COMMENT ON COLUMN cotizacion.codigo IS 'Código único de la cotización (ej: COT-001)';
COMMENT ON COLUMN cotizacion.cliente IS 'Nombre del cliente';
COMMENT ON COLUMN cotizacion.vendedor IS 'Nombre del vendedor';
COMMENT ON COLUMN cotizacion.sucursal IS 'Sucursal';
COMMENT ON COLUMN cotizacion.estado IS 'Estado: Pendiente, En Proceso, Aprobada, Rechazada';
COMMENT ON COLUMN cotizacion.subtotal IS 'Subtotal sin impuestos';
COMMENT ON COLUMN cotizacion.total_iva IS 'Total de IVA (13%)';
COMMENT ON COLUMN cotizacion.total_it IS 'Total de IT (3%)';
COMMENT ON COLUMN cotizacion.total_final IS 'Total final de la cotización';
COMMENT ON COLUMN cotizacion.vigencia IS 'Vigencia en días';
COMMENT ON COLUMN cotizacion.cantidad_items IS 'Cantidad de items en la cotización';
COMMENT ON COLUMN cotizacion.lineas_cotizacion IS 'Número de líneas de cotización';

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_cotizacion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cotizacion_updated_at
  BEFORE UPDATE ON cotizacion
  FOR EACH ROW
  EXECUTE FUNCTION update_cotizacion_updated_at();

