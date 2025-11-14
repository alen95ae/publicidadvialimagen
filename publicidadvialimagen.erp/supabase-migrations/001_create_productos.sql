-- Crear tabla PRODUCTOS en Supabase
CREATE TABLE IF NOT EXISTS PRODUCTOS (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CODIGO TEXT NOT NULL,
    NOMBRE TEXT NOT NULL,
    DESCRIPCION TEXT,
    IMAGEN_PORTADA TEXT,
    CATEGORIA TEXT NOT NULL DEFAULT 'Categoria general',
    RESPONSABLE TEXT,
    UNIDAD_MEDIDA TEXT NOT NULL,
    COSTE NUMERIC(10, 2) DEFAULT 0,
    PRECIO_VENTA NUMERIC(10, 2) DEFAULT 0,
    CANTIDAD NUMERIC(10, 2) DEFAULT 0,
    DISPONIBILIDAD TEXT DEFAULT 'Disponible',
    MOSTRAR_EN_WEB BOOLEAN DEFAULT false,
    VARIANTES JSONB DEFAULT '[]'::jsonb,
    RECETA JSONB DEFAULT '[]'::jsonb,
    PROVEEDORES JSONB DEFAULT '[]'::jsonb,
    CALCULADORA_DE_PRECIOS JSONB DEFAULT '{}'::jsonb,
    FECHA_CREACION TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FECHA_ACTUALIZACION TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS IDX_PRODUCTOS_CODIGO ON PRODUCTOS(CODIGO);
CREATE INDEX IF NOT EXISTS IDX_PRODUCTOS_NOMBRE ON PRODUCTOS(NOMBRE);
CREATE INDEX IF NOT EXISTS IDX_PRODUCTOS_CATEGORIA ON PRODUCTOS(CATEGORIA);
CREATE INDEX IF NOT EXISTS IDX_PRODUCTOS_FECHA_CREACION ON PRODUCTOS(FECHA_CREACION DESC);

-- Función para actualizar automáticamente FECHA_ACTUALIZACION
CREATE OR REPLACE FUNCTION update_productos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.FECHA_ACTUALIZACION = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar FECHA_ACTUALIZACION automáticamente
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON PRODUCTOS
    FOR EACH ROW
    EXECUTE FUNCTION update_productos_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE PRODUCTOS ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades de seguridad)
CREATE POLICY "Permitir lectura a usuarios autenticados"
    ON PRODUCTOS FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON PRODUCTOS FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización a usuarios autenticados"
    ON PRODUCTOS FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación a usuarios autenticados"
    ON PRODUCTOS FOR DELETE
    USING (auth.role() = 'authenticated');

