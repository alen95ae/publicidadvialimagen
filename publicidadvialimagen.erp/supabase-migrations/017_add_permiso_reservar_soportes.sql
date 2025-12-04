-- Migración: Añadir permiso técnico "reservar soportes"
-- Este permiso permite a usuarios (como vendedores) reservar soportes sin necesidad de tener permiso de editar

INSERT INTO permisos (modulo, accion)
VALUES ('tecnico', 'reservar soportes')
ON CONFLICT DO NOTHING;

-- Comentario
COMMENT ON TABLE permisos IS 'Tabla de permisos del sistema. Los permisos técnicos (modulo=tecnico) son funciones especiales que no requieren permisos de módulo estándar';



