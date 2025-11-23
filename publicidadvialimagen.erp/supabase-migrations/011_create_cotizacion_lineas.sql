-- Migración: Crear tabla de líneas de cotización
-- Esta migración crea la tabla de líneas de cotización con relación a cotizacion

CREATE TABLE IF NOT EXISTS cotizacion_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id UUID NOT NULL REFERENCES cotizacion(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'Producto' CHECK (tipo IN ('Producto', 'Nota', 'Sección')),
  codigo_producto TEXT,
  nombre_producto TEXT,
  descripcion TEXT,
  cantidad NUMERIC(10, 2) DEFAULT 0,
  ancho NUMERIC(10, 2),
  alto NUMERIC(10, 2),
  total_m2 NUMERIC(10, 2),
  unidad_medida TEXT DEFAULT 'm²',
  precio_unitario NUMERIC(12, 2) DEFAULT 0,
  comision NUMERIC(10, 2) DEFAULT 0,
  con_iva BOOLEAN DEFAULT true,
  con_it BOOLEAN DEFAULT true,
  es_soporte BOOLEAN DEFAULT false,
  orden INTEGER DEFAULT 0,
  imagen TEXT,
  variantes JSONB,
  subtotal_linea NUMERIC(12, 2) DEFAULT 0,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_cotizacion_lineas_cotizacion_id ON cotizacion_lineas(cotizacion_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_lineas_tipo ON cotizacion_lineas(tipo);
CREATE INDEX IF NOT EXISTS idx_cotizacion_lineas_orden ON cotizacion_lineas(cotizacion_id, orden);
CREATE INDEX IF NOT EXISTS idx_cotizacion_lineas_codigo_producto ON cotizacion_lineas(codigo_producto);

-- Comentarios en las columnas
COMMENT ON TABLE cotizacion_lineas IS 'Tabla de líneas de cotización';
COMMENT ON COLUMN cotizacion_lineas.cotizacion_id IS 'ID de la cotización padre (FK)';
COMMENT ON COLUMN cotizacion_lineas.tipo IS 'Tipo de línea: Producto, Nota, Sección';
COMMENT ON COLUMN cotizacion_lineas.codigo_producto IS 'Código del producto';
COMMENT ON COLUMN cotizacion_lineas.nombre_producto IS 'Nombre del producto';
COMMENT ON COLUMN cotizacion_lineas.descripcion IS 'Descripción de la línea';
COMMENT ON COLUMN cotizacion_lineas.cantidad IS 'Cantidad';
COMMENT ON COLUMN cotizacion_lineas.ancho IS 'Ancho en metros';
COMMENT ON COLUMN cotizacion_lineas.alto IS 'Alto en metros';
COMMENT ON COLUMN cotizacion_lineas.total_m2 IS 'Total de metros cuadrados';
COMMENT ON COLUMN cotizacion_lineas.unidad_medida IS 'Unidad de medida (m², unidad, etc.)';
COMMENT ON COLUMN cotizacion_lineas.precio_unitario IS 'Precio unitario';
COMMENT ON COLUMN cotizacion_lineas.comision IS 'Comisión en porcentaje';
COMMENT ON COLUMN cotizacion_lineas.con_iva IS 'Si aplica IVA';
COMMENT ON COLUMN cotizacion_lineas.con_it IS 'Si aplica IT';
COMMENT ON COLUMN cotizacion_lineas.es_soporte IS 'Si es un soporte publicitario';
COMMENT ON COLUMN cotizacion_lineas.orden IS 'Orden de la línea en la cotización';
COMMENT ON COLUMN cotizacion_lineas.imagen IS 'URL de la imagen';
COMMENT ON COLUMN cotizacion_lineas.variantes IS 'Variantes del producto en formato JSONB';
COMMENT ON COLUMN cotizacion_lineas.subtotal_linea IS 'Subtotal de la línea';



