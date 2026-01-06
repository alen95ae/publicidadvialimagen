-- ============================================
-- MIGRACIÓN: Crear tablas para configuración de notificaciones
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Permitir configurar qué roles reciben cada tipo de notificación
-- ============================================

-- Tabla de tipos de notificación
CREATE TABLE IF NOT EXISTS public.notificacion_tipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  entidad_tipo TEXT NOT NULL, -- ej: 'cotizacion', 'alquiler', 'formulario'
  tipo_default TEXT NOT NULL DEFAULT 'info' CHECK (tipo_default IN ('info', 'success', 'warning', 'error')),
  prioridad_default TEXT NOT NULL DEFAULT 'media' CHECK (prioridad_default IN ('baja', 'media', 'alta')),
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de relación entre tipos de notificación y roles
CREATE TABLE IF NOT EXISTS public.notificacion_roles (
  notificacion_tipo_id UUID NOT NULL REFERENCES public.notificacion_tipos(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notificacion_tipo_id, rol_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notificacion_tipos_codigo ON public.notificacion_tipos(codigo);
CREATE INDEX IF NOT EXISTS idx_notificacion_tipos_activa ON public.notificacion_tipos(activa);
CREATE INDEX IF NOT EXISTS idx_notificacion_roles_tipo ON public.notificacion_roles(notificacion_tipo_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_roles_rol ON public.notificacion_roles(rol_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_notificacion_tipos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificacion_tipos_updated_at
  BEFORE UPDATE ON public.notificacion_tipos
  FOR EACH ROW
  EXECUTE FUNCTION update_notificacion_tipos_updated_at();

CREATE OR REPLACE FUNCTION update_notificacion_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notificacion_roles_updated_at
  BEFORE UPDATE ON public.notificacion_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_notificacion_roles_updated_at();

-- Insertar tipos de notificación iniciales basados en las funciones existentes
INSERT INTO public.notificacion_tipos (codigo, titulo, descripcion, entidad_tipo, tipo_default, prioridad_default, activa)
VALUES
  ('formulario_nuevo', 'Nuevo formulario recibido', 'Notificación cuando se recibe un nuevo formulario desde la web', 'formulario', 'info', 'media', true),
  ('solicitud_cotizacion_web', 'Nueva solicitud de cotización', 'Notificación cuando se recibe una solicitud de cotización desde la web', 'solicitud', 'info', 'alta', true),
  ('stock_bajo', 'Stock bajo', 'Notificación cuando un producto tiene stock bajo', 'producto', 'warning', 'alta', true),
  ('alquiler_proximo_finalizar', 'Alquiler próximo a finalizar', 'Notificación cuando un alquiler está próximo a finalizar', 'alquiler', 'warning', 'media', true)
ON CONFLICT (codigo) DO NOTHING;

-- Comentarios
COMMENT ON TABLE public.notificacion_tipos IS 'Tipos de notificaciones disponibles en el sistema';
COMMENT ON TABLE public.notificacion_roles IS 'Configuración de qué roles reciben cada tipo de notificación';
COMMENT ON COLUMN public.notificacion_tipos.codigo IS 'Código único del tipo de notificación (ej: formulario_nuevo)';
COMMENT ON COLUMN public.notificacion_roles.enabled IS 'Indica si el rol recibe este tipo de notificación';

