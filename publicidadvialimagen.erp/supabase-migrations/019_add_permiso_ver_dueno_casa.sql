-- Migración: Añadir permiso técnico "ver dueño de casa"
-- Este permiso permite a usuarios ver la columna "Dueño de casa" en la tabla de costes de soportes

INSERT INTO permisos (modulo, accion)
VALUES ('tecnico', 'ver dueño de casa')
ON CONFLICT DO NOTHING;

-- Comentario
COMMENT ON TABLE permisos IS 'Tabla de permisos del sistema. Los permisos técnicos (modulo=tecnico) son funciones especiales que no requieren permisos de módulo estándar';

