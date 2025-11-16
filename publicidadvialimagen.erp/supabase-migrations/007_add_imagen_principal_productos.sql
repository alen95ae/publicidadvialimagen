-- Agregar columna imagen_principal a la tabla productos si no existe
-- Esta columna se usa para almacenar URLs de imágenes desde Supabase Storage

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'imagen_principal'
    ) THEN
        ALTER TABLE productos ADD COLUMN imagen_principal TEXT;
        
        -- Si existe imagen_portada, copiar los valores a imagen_principal
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'productos' 
            AND column_name = 'imagen_portada'
        ) THEN
            UPDATE productos 
            SET imagen_principal = imagen_portada 
            WHERE imagen_portada IS NOT NULL AND imagen_principal IS NULL;
        END IF;
        
        RAISE NOTICE 'Columna imagen_principal agregada a la tabla productos';
    ELSE
        RAISE NOTICE 'La columna imagen_principal ya existe en la tabla productos';
    END IF;
END $$;


