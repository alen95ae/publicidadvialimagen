-- Migración: Crear tabla de invitaciones
-- Esta migración crea la tabla de invitaciones con todos los campos necesarios

CREATE TABLE IF NOT EXISTS invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'usuario',
  token TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'usado', 'expirado', 'revocado')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  fecha_uso TIMESTAMPTZ,
  enlace TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_invitaciones_token ON invitaciones(token);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email ON invitaciones(email);
CREATE INDEX IF NOT EXISTS idx_invitaciones_estado ON invitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_invitaciones_email_estado ON invitaciones(email, estado);

-- Comentarios en las columnas
COMMENT ON TABLE invitaciones IS 'Tabla de invitaciones para registro de usuarios';
COMMENT ON COLUMN invitaciones.email IS 'Email del usuario invitado';
COMMENT ON COLUMN invitaciones.rol IS 'Rol asignado al usuario (usuario, admin, etc.)';
COMMENT ON COLUMN invitaciones.token IS 'Token único de la invitación';
COMMENT ON COLUMN invitaciones.estado IS 'Estado de la invitación: pendiente, usado, expirado, revocado';
COMMENT ON COLUMN invitaciones.fecha_creacion IS 'Fecha de creación de la invitación';
COMMENT ON COLUMN invitaciones.fecha_expiracion IS 'Fecha de expiración de la invitación';
COMMENT ON COLUMN invitaciones.fecha_uso IS 'Fecha en que se usó la invitación (null si no se ha usado)';
COMMENT ON COLUMN invitaciones.enlace IS 'Enlace completo de invitación';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invitaciones_updated_at
  BEFORE UPDATE ON invitaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

