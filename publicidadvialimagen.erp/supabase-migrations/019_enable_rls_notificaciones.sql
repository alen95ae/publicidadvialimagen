-- ============================================
-- MIGRACIÓN: Habilitar RLS para notificaciones
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Habilitar Row Level Security y crear policies
-- IMPORTANTE: Ejecutar SOLO después de completar migraciones y testing
-- ============================================

-- Habilitar RLS en notificaciones
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios solo ven notificaciones donde su rol está en roles_destino
CREATE POLICY "notificaciones_select_by_role" ON notificaciones
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = auth.uid()
      AND LOWER(r.nombre) = ANY(
        SELECT LOWER(unnest(roles_destino))
        FROM notificaciones n
        WHERE n.id = notificaciones.id
      )
    )
  );

-- Policy: Solo service role puede insertar (backend usa getSupabaseAdmin())
CREATE POLICY "notificaciones_insert_admin_only" ON notificaciones
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Habilitar RLS en notificaciones_leidas
ALTER TABLE notificaciones_leidas ENABLE ROW LEVEL SECURITY;

-- Usuarios solo ven sus propias lecturas
CREATE POLICY "notificaciones_leidas_select_own" ON notificaciones_leidas
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuarios solo pueden marcar sus propias lecturas
CREATE POLICY "notificaciones_leidas_insert_own" ON notificaciones_leidas
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
