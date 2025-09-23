-- =====================================================
-- MIGRACIÓN: Actualizar tabla inventario para el ERP
-- Publicidad Vial Imagen - Supabase/PostgreSQL
-- =====================================================

-- Primero, vamos a hacer backup de los datos existentes si los hay
CREATE TABLE IF NOT EXISTS inventario_backup AS SELECT * FROM inventario;

-- Eliminar la tabla actual y recrearla con la nueva estructura
DROP TABLE IF EXISTS movimientos_inventario CASCADE;
DROP TABLE IF EXISTS inventario CASCADE;

-- =====================================================
-- TABLA: inventario (Nueva estructura)
-- =====================================================
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    responsable VARCHAR(255) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL CHECK (unidad_medida IN ('unidad', 'm²', 'kg', 'hora', 'metro', 'litro', 'pieza', 'rollo', 'pliego')),
    coste DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
    categoria VARCHAR(100) NOT NULL CHECK (categoria IN ('Categoria general', 'Corte y grabado', 'Displays', 'Impresion digital', 'Insumos', 'Mano de obra')),
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    disponibilidad VARCHAR(20) NOT NULL DEFAULT 'Disponible' CHECK (disponibilidad IN ('Disponible', 'Bajo Stock', 'Agotado')),
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios de la tabla
COMMENT ON TABLE inventario IS 'Inventario de productos y servicios de la empresa de publicidad vial';
COMMENT ON COLUMN inventario.codigo IS 'Código único del producto/servicio';
COMMENT ON COLUMN inventario.nombre IS 'Nombre del producto o servicio';
COMMENT ON COLUMN inventario.responsable IS 'Persona responsable del producto/servicio';
COMMENT ON COLUMN inventario.unidad_medida IS 'Unidad de medida: unidad, m², kg, hora, metro, litro, pieza, rollo, pliego';
COMMENT ON COLUMN inventario.coste IS 'Coste del producto/servicio en bolivianos';
COMMENT ON COLUMN inventario.precio_venta IS 'Precio de venta del producto/servicio en bolivianos';
COMMENT ON COLUMN inventario.categoria IS 'Categoría del producto/servicio';
COMMENT ON COLUMN inventario.cantidad IS 'Cantidad disponible en stock';
COMMENT ON COLUMN inventario.disponibilidad IS 'Estado de disponibilidad: Disponible, Bajo Stock, Agotado';
COMMENT ON COLUMN inventario.descripcion IS 'Descripción detallada del producto/servicio';

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_inventario_codigo ON inventario(codigo);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_disponibilidad ON inventario(disponibilidad);
CREATE INDEX idx_inventario_responsable ON inventario(responsable);

-- =====================================================
-- TRIGGER para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventario_updated_at 
    BEFORE UPDATE ON inventario 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================
INSERT INTO inventario (codigo, nombre, responsable, unidad_medida, coste, precio_venta, categoria, cantidad, disponibilidad, descripcion) VALUES
('INV-001', 'Soporte Publicitario 6x3', 'Juan Pérez', 'unidad', 150.00, 250.00, 'Displays', 25, 'Disponible', 'Soporte publicitario de 6x3 metros para vallas publicitarias'),
('INV-002', 'Banner Vinilo 2x1', 'María García', 'm²', 45.00, 75.00, 'Impresion digital', 0, 'Agotado', 'Banner de vinilo de alta calidad para impresión digital'),
('INV-003', 'Estructura Metálica Base', 'Carlos López', 'unidad', 320.00, 450.00, 'Categoria general', 8, 'Bajo Stock', 'Estructura metálica base para soportes publicitarios'),
('INV-004', 'Tornillos Anclaje M8', 'Ana Martínez', 'kg', 12.50, 18.00, 'Insumos', 150, 'Disponible', 'Tornillos de anclaje M8 para fijación de estructuras'),
('INV-005', 'Servicio de Corte Láser', 'Pedro Ruiz', 'hora', 25.00, 40.00, 'Corte y grabado', 0, 'Disponible', 'Servicio de corte láser para materiales publicitarios'),
('INV-006', 'Instalación Publicitaria', 'Laura Sánchez', 'hora', 30.00, 50.00, 'Mano de obra', 0, 'Disponible', 'Servicio de instalación de elementos publicitarios');

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones a usuarios autenticados
CREATE POLICY "Permitir todas las operaciones a usuarios autenticados" ON inventario
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para calcular el porcentaje de utilidad
CREATE OR REPLACE FUNCTION calcular_porcentaje_utilidad(coste DECIMAL, precio_venta DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF coste = 0 THEN
        RETURN 0;
    END IF;
    RETURN ROUND(((precio_venta - coste) / coste) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Vista para mostrar inventario con porcentaje de utilidad
CREATE OR REPLACE VIEW inventario_con_utilidad AS
SELECT 
    *,
    calcular_porcentaje_utilidad(coste, precio_venta) as porcentaje_utilidad
FROM inventario;

COMMENT ON VIEW inventario_con_utilidad IS 'Vista del inventario con cálculo automático del porcentaje de utilidad';
