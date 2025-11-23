-- Migración: Crear tabla de contactos
CREATE TABLE IF NOT EXISTS contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_contacto TEXT NOT NULL DEFAULT 'Individual' CHECK (tipo_contacto IN ('Individual', 'Compañía')),
  empresa TEXT,
  relacion TEXT NOT NULL DEFAULT 'Cliente' CHECK (relacion IN ('Cliente', 'Proveedor', 'Ambos')),
  email TEXT,
  telefono TEXT,
  nit TEXT,
  direccion TEXT,
  ciudad TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'Bolivia',
  sitio_web TEXT,
  notas TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_contactos_nombre ON contactos(nombre);
CREATE INDEX IF NOT EXISTS idx_contactos_email ON contactos(email);
CREATE INDEX IF NOT EXISTS idx_contactos_tipo_contacto ON contactos(tipo_contacto);
CREATE INDEX IF NOT EXISTS idx_contactos_relacion ON contactos(relacion);
CREATE INDEX IF NOT EXISTS idx_contactos_empresa ON contactos(empresa);
CREATE INDEX IF NOT EXISTS idx_contactos_created_at ON contactos(created_at DESC);

-- Comentarios en las columnas
COMMENT ON TABLE contactos IS 'Tabla de contactos (clientes, proveedores)';
COMMENT ON COLUMN contactos.nombre IS 'Nombre del contacto o nombre comercial';
COMMENT ON COLUMN contactos.tipo_contacto IS 'Tipo: Individual o Compañía';
COMMENT ON COLUMN contactos.empresa IS 'Nombre legal de la empresa (para compañías)';
COMMENT ON COLUMN contactos.relacion IS 'Relación: Cliente, Proveedor o Ambos';
COMMENT ON COLUMN contactos.email IS 'Correo electrónico';
COMMENT ON COLUMN contactos.telefono IS 'Número de teléfono';
COMMENT ON COLUMN contactos.nit IS 'NIT o número de identificación fiscal';
COMMENT ON COLUMN contactos.direccion IS 'Dirección física';
COMMENT ON COLUMN contactos.ciudad IS 'Ciudad';
COMMENT ON COLUMN contactos.codigo_postal IS 'Código postal';
COMMENT ON COLUMN contactos.pais IS 'País';
COMMENT ON COLUMN contactos.sitio_web IS 'Sitio web';
COMMENT ON COLUMN contactos.notas IS 'Notas adicionales';

-- Trigger para actualizar fecha_actualizacion y updated_at automáticamente
CREATE OR REPLACE FUNCTION update_contactos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contactos_updated_at
  BEFORE UPDATE ON contactos
  FOR EACH ROW
  EXECUTE FUNCTION update_contactos_updated_at();





