
-- Agregar columna dif_precio a producto_variantes si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'producto_variantes' AND column_name = 'dif_precio') THEN
        ALTER TABLE producto_variantes ADD COLUMN dif_precio NUMERIC(10, 2);
    END IF;
END $$;

COMMENT ON COLUMN producto_variantes.dif_precio IS 'Diferencia de precio manual respecto al precio base';
