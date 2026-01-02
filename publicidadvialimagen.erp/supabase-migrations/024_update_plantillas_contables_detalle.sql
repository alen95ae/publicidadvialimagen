-- Migración: Actualizar estructura de plantillas_contables_detalle
-- Cambios:
-- 1. Eliminar columna 'rol' (hacerla nullable primero, luego opcional)
-- 2. Cambiar 'cuenta_fija' de TEXT a BOOLEAN 'cuenta_es_fija'
-- 3. Agregar columna 'cuenta_id' (FK a plan_cuentas) para almacenar la cuenta seleccionada
-- 4. Asegurar que cuenta_es_fija y permite_seleccionar_cuenta no choquen

-- Paso 1: Hacer 'rol' nullable (por si hay datos existentes)
ALTER TABLE plantillas_contables_detalle 
  ALTER COLUMN rol DROP NOT NULL;

-- Paso 2: Agregar nueva columna 'cuenta_es_fija' como BOOLEAN
ALTER TABLE plantillas_contables_detalle 
  ADD COLUMN IF NOT EXISTS cuenta_es_fija BOOLEAN DEFAULT false;

-- Paso 3: Migrar datos de 'cuenta_fija' (TEXT) a 'cuenta_es_fija' (BOOLEAN)
-- Si cuenta_fija tiene un valor, entonces cuenta_es_fija = true
UPDATE plantillas_contables_detalle 
SET cuenta_es_fija = (cuenta_fija IS NOT NULL AND cuenta_fija != '')
WHERE cuenta_es_fija IS NULL;

-- Paso 4: Agregar columna 'cuenta_id' (FK a plan_cuentas)
-- Primero verificar si existe la columna 'cuenta' en plan_cuentas para hacer FK
-- Como plan_cuentas usa 'cuenta' como string, usaremos TEXT para almacenar el código
ALTER TABLE plantillas_contables_detalle 
  ADD COLUMN IF NOT EXISTS cuenta_id TEXT NULL;

-- Paso 5: Migrar datos de 'cuenta_fija' (TEXT) a 'cuenta_id' (TEXT)
-- Si cuenta_fija tiene un valor, copiarlo a cuenta_id
UPDATE plantillas_contables_detalle 
SET cuenta_id = cuenta_fija
WHERE cuenta_fija IS NOT NULL AND cuenta_fija != '' AND cuenta_id IS NULL;

-- Paso 6: Agregar constraint para asegurar que cuenta_es_fija y permite_seleccionar_cuenta no sean ambos true
-- Si cuenta_es_fija = true, entonces permite_seleccionar_cuenta debe ser false
-- Si permite_seleccionar_cuenta = true, entonces cuenta_es_fija debe ser false
-- O ambos pueden ser false (no hay cuenta)
ALTER TABLE plantillas_contables_detalle 
  ADD CONSTRAINT check_cuenta_exclusiva 
  CHECK (
    (cuenta_es_fija = false AND permite_seleccionar_cuenta = false) OR
    (cuenta_es_fija = true AND permite_seleccionar_cuenta = false) OR
    (cuenta_es_fija = false AND permite_seleccionar_cuenta = true)
  );

-- Paso 7: Agregar constraint para que si cuenta_es_fija = true, cuenta_id debe estar presente
ALTER TABLE plantillas_contables_detalle 
  ADD CONSTRAINT check_cuenta_fija_requiere_cuenta_id 
  CHECK (
    (cuenta_es_fija = false) OR 
    (cuenta_es_fija = true AND cuenta_id IS NOT NULL AND cuenta_id != '')
  );

-- Paso 8: Agregar constraint para que si permite_seleccionar_cuenta = true, cuenta_id puede estar presente o no
-- (No necesita constraint adicional, ya que permite_seleccionar_cuenta permite selección opcional)

-- Paso 9: Actualizar comentarios
COMMENT ON COLUMN plantillas_contables_detalle.rol IS 'Rol contable (DEPRECADO - se mantiene por compatibilidad, puede ser NULL)';
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_es_fija IS 'Si la cuenta está fija (no se puede cambiar). Si es true, cuenta_id es obligatorio.';
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_id IS 'Código de cuenta del plan de cuentas. Obligatorio si cuenta_es_fija = true.';
COMMENT ON COLUMN plantillas_contables_detalle.permite_seleccionar_cuenta IS 'Si el usuario puede seleccionar la cuenta. Si es true, cuenta_es_fija debe ser false.';
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_fija IS 'DEPRECADO - usar cuenta_es_fija y cuenta_id en su lugar';

-- Paso 10: Crear índice para cuenta_id
CREATE INDEX IF NOT EXISTS idx_plantillas_contables_detalle_cuenta_id 
  ON plantillas_contables_detalle(cuenta_id);

-- Nota: No eliminamos la columna 'cuenta_fija' por ahora para mantener compatibilidad
-- Se puede eliminar en una migración futura después de verificar que todo funciona

