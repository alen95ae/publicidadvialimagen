-- =====================================================
-- Migración: Agregar columna bloqueado a plantillas_contables_detalle
-- Fecha: 2026-01-02
-- Descripción: Define explícitamente qué líneas son editables vs calculadas
-- =====================================================

-- 1. Agregar columna bloqueado (boolean, NOT NULL, default false)
ALTER TABLE plantillas_contables_detalle 
ADD COLUMN bloqueado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN plantillas_contables_detalle.bloqueado IS 
'Define si la línea es editable (false) o calculada automáticamente (true). 
- bloqueado = false: línea base, el usuario puede editar montos
- bloqueado = true: línea derivada, se calcula automáticamente según porcentaje';

-- 2. Migrar datos: marcar como bloqueadas las líneas con porcentaje > 0
UPDATE plantillas_contables_detalle
SET bloqueado = true
WHERE porcentaje IS NOT NULL AND porcentaje > 0;

-- 3. Verificación
DO $$
DECLARE
    total_lineas INT;
    lineas_bloqueadas INT;
    lineas_editables INT;
BEGIN
    SELECT COUNT(*) INTO total_lineas FROM plantillas_contables_detalle;
    SELECT COUNT(*) INTO lineas_bloqueadas FROM plantillas_contables_detalle WHERE bloqueado = true;
    SELECT COUNT(*) INTO lineas_editables FROM plantillas_contables_detalle WHERE bloqueado = false;
    
    RAISE NOTICE '✅ Migración completada:';
    RAISE NOTICE '   Total de líneas: %', total_lineas;
    RAISE NOTICE '   Líneas bloqueadas (calculadas): %', lineas_bloqueadas;
    RAISE NOTICE '   Líneas editables (base): %', lineas_editables;
END $$;

