-- ============================================
-- MIGRACIÓN: Sistema de Notificaciones Simplificado
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Eliminar duplicados, una notificación = un evento
-- ============================================

-- 1. Crear nueva tabla notificaciones_leidas
CREATE TABLE IF NOT EXISTS notificaciones_leidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  leida BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notificacion_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_leidas_user ON notificaciones_leidas(user_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leidas_notificacion ON notificaciones_leidas(notificacion_id);

-- 2. Añadir columna roles_destino a notificaciones
-- Primero verificar si existe, si no existe añadirla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notificaciones' 
    AND column_name = 'roles_destino'
  ) THEN
    ALTER TABLE notificaciones 
      ADD COLUMN roles_destino TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
  END IF;
END $$;

-- 3. Migrar datos existentes (si hay)
-- Asignar roles_destino basado en user_id existente
-- Esto es una migración de datos legacy
DO $$
DECLARE
  notif RECORD;
  user_rol TEXT;
BEGIN
  FOR notif IN SELECT n.id, n.user_id FROM notificaciones n WHERE array_length(n.roles_destino, 1) IS NULL LOOP
    -- Obtener rol del usuario
    SELECT r.nombre INTO user_rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = notif.user_id;
    
    -- Asignar rol por defecto (admin si no se encuentra)
    IF user_rol IS NULL THEN
      user_rol := 'admin';
    END IF;
    
    -- Actualizar roles_destino
    UPDATE notificaciones 
    SET roles_destino = ARRAY[user_rol]
    WHERE id = notif.id;
  END LOOP;
END $$;

-- 4. Migrar notificaciones_leidas desde campo leida
-- Si una notificación tiene leida=true para un user_id, crear registro en notificaciones_leidas
INSERT INTO notificaciones_leidas (notificacion_id, user_id, leida, created_at)
SELECT id, user_id, true, created_at
FROM notificaciones
WHERE leida = true AND user_id IS NOT NULL
ON CONFLICT (notificacion_id, user_id) DO NOTHING;

-- 5. Eliminar columna user_id de notificaciones (OPCIONAL - comentado por seguridad)
-- ALTER TABLE notificaciones DROP COLUMN IF EXISTS user_id;

-- 6. Eliminar columna leida de notificaciones (OPCIONAL - comentado por seguridad)
-- ALTER TABLE notificaciones DROP COLUMN IF EXISTS leida;

-- NOTA: Las columnas user_id y leida se mantienen temporalmente para compatibilidad
-- Se pueden eliminar después de verificar que todo funciona correctamente



