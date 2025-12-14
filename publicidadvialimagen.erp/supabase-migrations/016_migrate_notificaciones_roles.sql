-- ============================================
-- MIGRACIÓN: Migrar datos a roles_destino
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Poblar roles_destino en notificaciones existentes
-- ============================================

-- Migrar notificaciones existentes basándose en user_id
DO $$
DECLARE
  notif RECORD;
  user_rol TEXT;
BEGIN
  FOR notif IN 
    SELECT n.id, n.user_id, n.roles_destino
    FROM notificaciones n
    WHERE array_length(n.roles_destino, 1) IS NULL
    AND n.user_id IS NOT NULL
  LOOP
    -- Obtener rol del usuario
    SELECT LOWER(r.nombre) INTO user_rol
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    WHERE u.id = notif.user_id;
    
    -- Si no se encuentra rol, usar 'admin' por defecto
    IF user_rol IS NULL THEN
      user_rol := 'admin';
    END IF;
    
    -- Actualizar roles_destino
    UPDATE notificaciones
    SET roles_destino = ARRAY[user_rol]
    WHERE id = notif.id;
    
    RAISE NOTICE 'Migrada notificación % para rol %', notif.id, user_rol;
  END LOOP;
  
  -- Para notificaciones sin user_id, asignar 'admin' por defecto
  UPDATE notificaciones
  SET roles_destino = ARRAY['admin']
  WHERE array_length(roles_destino, 1) IS NULL;
END $$;
