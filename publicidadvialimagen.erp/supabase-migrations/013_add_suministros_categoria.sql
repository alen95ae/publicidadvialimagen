-- Agregar la categoría 'Suministros' a la tabla recursos
-- Primero eliminamos todas las restricciones CHECK existentes en la columna categoria
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Buscar el nombre de la restricción CHECK en la columna categoria
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'recursos'::regclass
      AND contype = 'c'
      AND (pg_get_constraintdef(oid) LIKE '%categoria%' OR pg_get_constraintdef(oid) LIKE '%CATEGORIA%');
    
    -- Si encontramos una restricción, eliminarla
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE recursos DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Agregamos la nueva restricción CHECK que incluye 'Suministros'
ALTER TABLE recursos ADD CONSTRAINT recursos_categoria_check 
  CHECK (categoria IN ('Insumos', 'Mano de Obra', 'Suministros'));

