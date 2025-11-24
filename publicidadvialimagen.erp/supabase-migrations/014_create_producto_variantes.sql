-- Crear tabla PRODUCTO_VARIANTES en Supabase
-- Esta tabla almacena las variantes de productos con sus overrides de coste/precio/margen

CREATE TABLE IF NOT EXISTS producto_variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    combinacion TEXT NOT NULL, -- Formato: "Color:Blanco|Tamaño:A4"
    coste_override NUMERIC(10, 2), -- NULL = usar coste base del producto
    precio_override NUMERIC(10, 2), -- NULL = usar precio base del producto
    margen_override NUMERIC(10, 2), -- NULL = usar margen base del producto
    coste_calculado NUMERIC(10, 2) DEFAULT 0, -- Coste calculado automáticamente
    precio_calculado NUMERIC(10, 2) DEFAULT 0, -- Precio calculado automáticamente
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, combinacion)
);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_producto_variantes_producto_id ON producto_variantes(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_variantes_combinacion ON producto_variantes(combinacion);

-- Función para actualizar automáticamente FECHA_ACTUALIZACION
CREATE OR REPLACE FUNCTION update_producto_variantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar FECHA_ACTUALIZACION automáticamente
CREATE TRIGGER update_producto_variantes_updated_at
    BEFORE UPDATE ON producto_variantes
    FOR EACH ROW
    EXECUTE FUNCTION update_producto_variantes_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE producto_variantes ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Permitir lectura a usuarios autenticados"
    ON producto_variantes FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON producto_variantes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización a usuarios autenticados"
    ON producto_variantes FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación a usuarios autenticados"
    ON producto_variantes FOR DELETE
    USING (auth.role() = 'authenticated');

-- Comentarios
COMMENT ON TABLE producto_variantes IS 'Tabla de variantes de productos con overrides de coste/precio/margen';
COMMENT ON COLUMN producto_variantes.combinacion IS 'Combinación de variantes en formato "Nombre:Valor|Nombre:Valor"';
COMMENT ON COLUMN producto_variantes.coste_override IS 'Coste personalizado para esta variante (NULL = usar coste base)';
COMMENT ON COLUMN producto_variantes.precio_override IS 'Precio personalizado para esta variante (NULL = usar precio base)';
COMMENT ON COLUMN producto_variantes.margen_override IS 'Margen personalizado para esta variante (NULL = usar margen base)';

