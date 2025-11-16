-- Migración: Actualizar tabla de solicitudes existente
-- Este script actualiza la tabla si ya existe o la crea si no existe

-- Primero, agregar campos faltantes si no existen
DO $$ 
BEGIN
  -- Agregar empresa si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'solicitudes' AND column_name = 'empresa') THEN
    ALTER TABLE solicitudes ADD COLUMN empresa TEXT;
  END IF;

  -- Agregar contacto si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'solicitudes' AND column_name = 'contacto') THEN
    ALTER TABLE solicitudes ADD COLUMN contacto TEXT;
  END IF;

  -- Agregar telefono si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'solicitudes' AND column_name = 'telefono') THEN
    ALTER TABLE solicitudes ADD COLUMN telefono TEXT;
  END IF;

  -- Agregar email si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'solicitudes' AND column_name = 'email') THEN
    ALTER TABLE solicitudes ADD COLUMN email TEXT;
  END IF;

  -- Agregar comentarios si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'solicitudes' AND column_name = 'comentarios') THEN
    ALTER TABLE solicitudes ADD COLUMN comentarios TEXT;
  END IF;
END $$;

-- Eliminar constraint antigua si existe (puede tener un nombre diferente)
DO $$ 
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar el nombre de la constraint del estado
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'solicitudes'::regclass
    AND contype = 'c'
    AND conname LIKE '%estado%';
  
  -- Si existe, eliminarla
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE solicitudes DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

-- Crear la constraint correcta para el estado
ALTER TABLE solicitudes 
  DROP CONSTRAINT IF EXISTS solicitudes_estado_check;

ALTER TABLE solicitudes 
  ADD CONSTRAINT solicitudes_estado_check 
  CHECK (estado IN ('Nueva', 'Pendiente', 'Cotizada'));

-- Asegurar que el estado tenga un valor por defecto
ALTER TABLE solicitudes 
  ALTER COLUMN estado SET DEFAULT 'Nueva';

-- Asegurar que el estado no sea NULL
ALTER TABLE solicitudes 
  ALTER COLUMN estado SET NOT NULL;

-- Comentarios en las columnas (si no existen)
COMMENT ON COLUMN solicitudes.empresa IS 'Nombre de la empresa solicitante';
COMMENT ON COLUMN solicitudes.contacto IS 'Nombre del contacto';
COMMENT ON COLUMN solicitudes.telefono IS 'Teléfono de contacto';
COMMENT ON COLUMN solicitudes.email IS 'Email de contacto';
COMMENT ON COLUMN solicitudes.comentarios IS 'Comentarios adicionales de la solicitud';



