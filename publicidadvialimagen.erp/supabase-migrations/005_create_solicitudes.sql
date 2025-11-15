-- Migración: Crear tabla de solicitudes
-- Esta migración crea la tabla de solicitudes con todos los campos necesarios

CREATE TABLE IF NOT EXISTS solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'Nueva' CHECK (estado IN ('Nueva', 'Pendiente', 'Cotizada')),
  fecha_inicio DATE NOT NULL,
  meses_alquiler INTEGER NOT NULL,
  soporte TEXT NOT NULL,
  servicios_adicionales TEXT[],
  empresa TEXT,
  contacto TEXT,
  telefono TEXT,
  email TEXT,
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_solicitudes_codigo ON solicitudes(codigo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at ON solicitudes(created_at DESC);

-- Comentarios en las columnas
COMMENT ON TABLE solicitudes IS 'Tabla de solicitudes de cotización';
COMMENT ON COLUMN solicitudes.codigo IS 'Código único de la solicitud (ej: SC-001)';
COMMENT ON COLUMN solicitudes.estado IS 'Estado de la solicitud: Nueva, Pendiente, Cotizada';
COMMENT ON COLUMN solicitudes.fecha_inicio IS 'Fecha de inicio del alquiler';
COMMENT ON COLUMN solicitudes.meses_alquiler IS 'Número de meses de alquiler';
COMMENT ON COLUMN solicitudes.soporte IS 'Código del soporte publicitario';
COMMENT ON COLUMN solicitudes.servicios_adicionales IS 'Array de servicios adicionales solicitados';
COMMENT ON COLUMN solicitudes.empresa IS 'Nombre de la empresa solicitante';
COMMENT ON COLUMN solicitudes.contacto IS 'Nombre del contacto';
COMMENT ON COLUMN solicitudes.telefono IS 'Teléfono de contacto';
COMMENT ON COLUMN solicitudes.email IS 'Email de contacto';
COMMENT ON COLUMN solicitudes.comentarios IS 'Comentarios adicionales de la solicitud';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_solicitudes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_solicitudes_updated_at
  BEFORE UPDATE ON solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION update_solicitudes_updated_at();

