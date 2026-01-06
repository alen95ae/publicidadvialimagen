-- ============================================
-- MIGRACIÓN: Inicializar matriz notificacion_roles
-- ============================================
-- Fecha: 2025-01-XX
-- Objetivo: Crear todas las combinaciones notificacion_tipos × roles con enabled=false
-- ============================================

-- Insertar todas las combinaciones posibles (notificacion_tipos × roles)
-- Solo si no existen ya (idempotente)
INSERT INTO public.notificacion_roles (notificacion_tipo_id, rol_id, enabled)
SELECT 
  nt.id AS notificacion_tipo_id,
  r.id AS rol_id,
  false AS enabled
FROM public.notificacion_tipos nt
CROSS JOIN public.roles r
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.notificacion_roles nr
  WHERE nr.notificacion_tipo_id = nt.id
    AND nr.rol_id = r.id
);

-- Comentario
COMMENT ON TABLE public.notificacion_roles IS 'Matriz inicializada: todas las combinaciones tipo×rol con enabled=false por defecto';

