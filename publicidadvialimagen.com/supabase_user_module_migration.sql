-- Script SQL para el módulo de usuarios
-- Ejecutar en Supabase SQL Editor

-- =====================================================
-- TABLA: favoritos
-- Relación entre usuarios y soportes favoritos
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favoritos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  soporte_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para mejorar el rendimiento
  UNIQUE(user_id, soporte_id)
);

-- Índices para la tabla favoritos
CREATE INDEX IF NOT EXISTS idx_favoritos_user_id ON public.favoritos(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_soporte_id ON public.favoritos(soporte_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_created_at ON public.favoritos(created_at DESC);

-- RLS (Row Level Security) para favoritos
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios favoritos
CREATE POLICY "Users can view own favorites"
  ON public.favoritos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios favoritos
CREATE POLICY "Users can insert own favorites"
  ON public.favoritos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios favoritos
CREATE POLICY "Users can delete own favorites"
  ON public.favoritos
  FOR DELETE
  USING (auth.uid() = user_id);


-- =====================================================
-- TABLA: cotizaciones
-- Solicitudes de cotización de usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  mensaje TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'respondida', 'cerrada')),
  respuesta TEXT,
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla cotizaciones
CREATE INDEX IF NOT EXISTS idx_cotizaciones_user_id ON public.cotizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created_at ON public.cotizaciones(created_at DESC);

-- RLS para cotizaciones
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias cotizaciones
CREATE POLICY "Users can view own quotes"
  ON public.cotizaciones
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propias cotizaciones
CREATE POLICY "Users can insert own quotes"
  ON public.cotizaciones
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Solo admins pueden actualizar cotizaciones (para responder)
CREATE POLICY "Service role can update quotes"
  ON public.cotizaciones
  FOR UPDATE
  USING (true);


-- =====================================================
-- TABLA: mensajes
-- Mensajes de contacto y respuestas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  asunto TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT FALSE,
  respondido BOOLEAN DEFAULT FALSE,
  respuesta TEXT,
  fecha_respuesta TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para la tabla mensajes
CREATE INDEX IF NOT EXISTS idx_mensajes_user_id ON public.mensajes(user_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_leido ON public.mensajes(leido);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON public.mensajes(created_at DESC);

-- RLS para mensajes
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios mensajes
CREATE POLICY "Users can view own messages"
  ON public.mensajes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar sus propios mensajes
CREATE POLICY "Users can insert own messages"
  ON public.mensajes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar el estado de lectura de sus mensajes
CREATE POLICY "Users can update own messages read status"
  ON public.mensajes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en cotizaciones
DROP TRIGGER IF EXISTS update_cotizaciones_updated_at ON public.cotizaciones;
CREATE TRIGGER update_cotizaciones_updated_at
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Insertar algunas cotizaciones de ejemplo
-- NOTA: Reemplaza 'USER_ID_AQUI' con un UUID real de un usuario de prueba
/*
INSERT INTO public.cotizaciones (user_id, empresa, email, telefono, mensaje, estado) VALUES
  ('USER_ID_AQUI', 'Empresa Demo S.A.', 'demo@empresa.com', '591-12345678', 'Solicito cotización para vallas en La Paz', 'pendiente'),
  ('USER_ID_AQUI', 'Marketing Total', 'contacto@marketingtotal.com', '591-87654321', 'Necesito información sobre precios y disponibilidad', 'respondida');
*/

-- Insertar algunos mensajes de ejemplo
/*
INSERT INTO public.mensajes (user_id, email, asunto, mensaje) VALUES
  ('USER_ID_AQUI', 'usuario@email.com', 'Consulta sobre servicios', 'Me gustaría obtener más información sobre sus servicios de publicidad vial'),
  ('USER_ID_AQUI', 'usuario@email.com', 'Disponibilidad de espacios', '¿Tienen disponibilidad en la zona sur de La Paz?');
*/


-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('favoritos', 'cotizaciones', 'mensajes');

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('favoritos', 'cotizaciones', 'mensajes')
ORDER BY tablename, policyname;

