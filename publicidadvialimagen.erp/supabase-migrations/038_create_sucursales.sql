-- Tabla sucursales (misma estructura que empresas sin casilla, con campo sucursal)
-- Ejecutar en Supabase SQL Editor

-- Función para updated_at (omitir si ya existe por tabla empresas)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS sucursales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  representante TEXT,
  direccion TEXT,
  sucursal TEXT,
  telefonos TEXT,
  email TEXT,
  pais TEXT,
  ciudad TEXT,
  localidad TEXT,
  nit TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_sucursales_empresa_id ON sucursales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sucursales_codigo ON sucursales(codigo);

DROP TRIGGER IF EXISTS sucursales_updated_at ON sucursales;
CREATE TRIGGER sucursales_updated_at
  BEFORE UPDATE ON sucursales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
