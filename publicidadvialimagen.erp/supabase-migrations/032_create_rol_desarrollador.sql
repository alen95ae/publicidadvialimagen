-- ============================================
-- MIGRACIÓN: Crear rol "desarrollador" con todos los permisos
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Eliminar hardcodeo de desarrollador y usar sistema de permisos real
-- ============================================

-- 1. Crear rol "desarrollador" si no existe
INSERT INTO roles (nombre, descripcion)
VALUES ('desarrollador', 'Rol con acceso total al sistema. Reemplaza el hardcodeo por email.')
ON CONFLICT (nombre) DO NOTHING;

-- 2. Obtener el ID del rol desarrollador
DO $$
DECLARE
  rol_desarrollador_id UUID;
BEGIN
  -- Obtener ID del rol desarrollador
  SELECT id INTO rol_desarrollador_id
  FROM roles
  WHERE nombre = 'desarrollador'
  LIMIT 1;

  -- Si el rol no existe, crearlo y obtener su ID
  IF rol_desarrollador_id IS NULL THEN
    INSERT INTO roles (nombre, descripcion)
    VALUES ('desarrollador', 'Rol con acceso total al sistema. Reemplaza el hardcodeo por email.')
    RETURNING id INTO rol_desarrollador_id;
  END IF;

  -- 3. Asignar TODOS los permisos existentes al rol desarrollador
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT rol_desarrollador_id, p.id
  FROM permisos p
  WHERE NOT EXISTS (
    SELECT 1
    FROM rol_permisos rp
    WHERE rp.rol_id = rol_desarrollador_id
      AND rp.permiso_id = p.id
  );

  RAISE NOTICE 'Rol desarrollador creado/actualizado con ID: %', rol_desarrollador_id;
  RAISE NOTICE 'Permisos asignados al rol desarrollador';
END $$;

-- Comentario
COMMENT ON TABLE roles IS 'Tabla de roles del sistema. El rol "desarrollador" tiene todos los permisos asignados explícitamente en rol_permisos.';

