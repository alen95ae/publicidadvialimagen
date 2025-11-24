-- Crear tabla RECURSOS en Supabase
CREATE TABLE IF NOT EXISTS RECURSOS (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    CODIGO TEXT NOT NULL,
    NOMBRE TEXT NOT NULL,
    DESCRIPCION TEXT,
    IMAGEN_PORTADA TEXT,
    CATEGORIA TEXT NOT NULL CHECK (CATEGORIA IN ('Insumos', 'Mano de Obra', 'Suministros')),
    RESPONSABLE TEXT,
    UNIDAD_MEDIDA TEXT NOT NULL,
    CANTIDAD NUMERIC(10, 2) DEFAULT 0,
    COSTE NUMERIC(10, 2) DEFAULT 0,
    PRECIO_VENTA NUMERIC(10, 2) DEFAULT 0,
    VARIANTES JSONB DEFAULT '[]'::jsonb,
    CONTROL_STOCK JSONB DEFAULT '{}'::jsonb,
    FECHA_CREACION TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FECHA_ACTUALIZACION TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas
CREATE INDEX IF NOT EXISTS IDX_RECURSOS_CODIGO ON RECURSOS(CODIGO);
CREATE INDEX IF NOT EXISTS IDX_RECURSOS_NOMBRE ON RECURSOS(NOMBRE);
CREATE INDEX IF NOT EXISTS IDX_RECURSOS_CATEGORIA ON RECURSOS(CATEGORIA);
CREATE INDEX IF NOT EXISTS IDX_RECURSOS_FECHA_CREACION ON RECURSOS(FECHA_CREACION DESC);

-- Función para actualizar automáticamente FECHA_ACTUALIZACION
CREATE OR REPLACE FUNCTION update_recursos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.FECHA_ACTUALIZACION = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar FECHA_ACTUALIZACION automáticamente
CREATE TRIGGER update_recursos_updated_at
    BEFORE UPDATE ON RECURSOS
    FOR EACH ROW
    EXECUTE FUNCTION update_recursos_updated_at();

-- Habilitar Row Level Security (RLS)
ALTER TABLE RECURSOS ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajusta según tus necesidades de seguridad)
CREATE POLICY "Permitir lectura a usuarios autenticados"
    ON RECURSOS FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserción a usuarios autenticados"
    ON RECURSOS FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir actualización a usuarios autenticados"
    ON RECURSOS FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir eliminación a usuarios autenticados"
    ON RECURSOS FOR DELETE
    USING (auth.role() = 'authenticated');

