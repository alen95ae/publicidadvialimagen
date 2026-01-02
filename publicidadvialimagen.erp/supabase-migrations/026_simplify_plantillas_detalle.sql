-- Migración: Simplificar plantillas_contables_detalle
-- Eliminamos el constraint de exclusión mutua entre cuenta_es_fija y permite_seleccionar_cuenta
-- Ya que la lógica ahora es más simple:
-- - cuenta_es_fija = true: cuenta predefinida (obligatoria)
-- - cuenta_es_fija = false: el usuario seleccionará la cuenta al ejecutar la plantilla

-- Paso 1: Eliminar el constraint de exclusión mutua (si existe)
ALTER TABLE plantillas_contables_detalle 
  DROP CONSTRAINT IF EXISTS check_cuenta_exclusiva;

-- Paso 2: Actualizar comentarios
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_es_fija IS 'Si la cuenta está predefinida (true) o se seleccionará al ejecutar (false)';
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_id IS 'ID de cuenta del plan de cuentas. Obligatorio si cuenta_es_fija = true.';
COMMENT ON COLUMN plantillas_contables_detalle.permite_seleccionar_cuenta IS 'DEPRECADO - La funcionalidad ahora está cubierta por cuenta_es_fija';
