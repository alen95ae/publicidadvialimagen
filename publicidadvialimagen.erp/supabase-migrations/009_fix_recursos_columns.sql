-- Verificar y agregar columnas faltantes en la tabla recursos
-- Esto asegura que todas las columnas necesarias existan
-- NOTA: La columna cantidad NO se agrega porque no existe en la tabla recursos
-- Se usa control_stock para manejar el stock, no cantidad

DO $$ 
BEGIN
    -- Agregar columna imagen_principal si no existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recursos' 
        AND column_name = 'imagen_principal'
    ) THEN
        ALTER TABLE recursos ADD COLUMN imagen_principal TEXT;
        
        -- Si existe imagen_portada, copiar los valores a imagen_principal
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'recursos' 
            AND column_name = 'imagen_portada'
        ) THEN
            UPDATE recursos 
            SET imagen_principal = imagen_portada 
            WHERE imagen_portada IS NOT NULL AND imagen_principal IS NULL;
        END IF;
        
        RAISE NOTICE 'Columna imagen_principal agregada a la tabla recursos';
    ELSE
        RAISE NOTICE 'La columna imagen_principal ya existe en la tabla recursos';
    END IF;
    
    -- Verificar que todas las columnas necesarias existan
    -- Si alguna falta, se agregará con valores por defecto
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recursos' 
        AND column_name = 'variantes'
    ) THEN
        ALTER TABLE recursos ADD COLUMN variantes JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Columna variantes agregada a la tabla recursos';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recursos' 
        AND column_name = 'control_stock'
    ) THEN
        ALTER TABLE recursos ADD COLUMN control_stock JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Columna control_stock agregada a la tabla recursos';
    END IF;
    
END $$;

