-- Migración: Añadir permiso técnico "ver historial soportes"
-- Este permiso permite a usuarios ver el historial de soportes
-- Conectado a la columna accion con id=68 de la tabla permisos

-- Si el permiso con id=68 ya existe, actualizarlo
-- Si no existe, crearlo (el id se generará automáticamente si es UUID)
-- Nota: Si necesitas que tenga id=68 específicamente, ajusta esta migración según tu esquema de base de datos

INSERT INTO permisos (modulo, accion)
VALUES ('tecnico', 'ver historial soportes')
ON CONFLICT DO NOTHING;

-- Si el id es numérico y necesitas que sea 68 específicamente, usa esta versión:
-- INSERT INTO permisos (id, modulo, accion)
-- VALUES (68, 'tecnico', 'ver historial soportes')
-- ON CONFLICT (id) DO UPDATE 
-- SET modulo = EXCLUDED.modulo, 
--     accion = EXCLUDED.accion;

-- Comentario
COMMENT ON TABLE permisos IS 'Tabla de permisos del sistema. Los permisos técnicos (modulo=tecnico) son funciones especiales que no requieren permisos de módulo estándar';

