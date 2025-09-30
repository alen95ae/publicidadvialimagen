-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA ERP DE VALLAS PUBLICITARIAS
-- Publicidad Vial Imagen - Supabase/PostgreSQL
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =====================================================
-- TABLA: clientes
-- =====================================================
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial VARCHAR(255) NOT NULL,
    nombre_contacto VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(50),
    cif_nif VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100) DEFAULT 'España',
    tipo_cliente VARCHAR(20) NOT NULL CHECK (tipo_cliente IN ('persona', 'empresa')),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE clientes IS 'Clientes de la empresa, pueden ser personas físicas o jurídicas';
COMMENT ON COLUMN clientes.tipo_cliente IS 'Tipo de cliente: persona física o empresa';
COMMENT ON COLUMN clientes.estado IS 'Estado del cliente: activo, inactivo o suspendido';

-- =====================================================
-- TABLA: duenos_casa
-- =====================================================
CREATE TABLE duenos_casa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100) DEFAULT 'España',
    tipo_propietario VARCHAR(20) NOT NULL CHECK (tipo_propietario IN ('persona', 'empresa', 'ayuntamiento')),
    condiciones_renta TEXT,
    porcentaje_comision DECIMAL(5,2),
    renta_fija DECIMAL(10,2),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE duenos_casa IS 'Propietarios de los soportes publicitarios (terrenos, edificios, etc.)';
COMMENT ON COLUMN duenos_casa.tipo_propietario IS 'Tipo de propietario: persona, empresa o ayuntamiento';
COMMENT ON COLUMN duenos_casa.porcentaje_comision IS 'Porcentaje de comisión sobre ingresos (0-100)';
COMMENT ON COLUMN duenos_casa.renta_fija IS 'Renta fija mensual en euros';

-- =====================================================
-- TABLA: empleados
-- =====================================================
CREATE TABLE empleados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'comercial', 'tecnico', 'administrativo', 'gerente')),
    departamento VARCHAR(100),
    salario_base DECIMAL(10,2),
    fecha_contratacion DATE,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vacaciones')),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE empleados IS 'Empleados de la empresa con diferentes roles y responsabilidades';
COMMENT ON COLUMN empleados.rol IS 'Rol del empleado: admin, comercial, técnico, administrativo o gerente';

-- =====================================================
-- TABLA: soportes
-- =====================================================
CREATE TABLE soportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    ancho DECIMAL(8,2) NOT NULL, -- en metros
    alto DECIMAL(8,2) NOT NULL, -- en metros
    area_total DECIMAL(10,2) GENERATED ALWAYS AS (ancho * alto) STORED, -- en m²
    ubicacion GEOMETRY(POINT, 4326), -- coordenadas GPS
    ciudad VARCHAR(100),
    disponibilidad VARCHAR(20) DEFAULT 'disponible' CHECK (disponibilidad IN ('disponible', 'ocupado', 'reservado', 'no_disponible')),
    precio_mes DECIMAL(10,2),
    impactos_diarios INTEGER,
    ubicacion_url TEXT, -- URL de Google Maps
    foto_url TEXT,
    foto_url_2 TEXT,
    foto_url_3 TEXT,
    dueno_casa_id UUID NOT NULL,
    empleado_responsable_id UUID,
    fecha_instalacion DATE,
    fecha_ultimo_mantenimiento DATE,
    proximo_mantenimiento DATE,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_soportes_dueno_casa 
        FOREIGN KEY (dueno_casa_id) 
        REFERENCES duenos_casa(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_soportes_empleado 
        FOREIGN KEY (empleado_responsable_id) 
        REFERENCES empleados(id) 
        ON DELETE SET NULL
);

COMMENT ON TABLE soportes IS 'Soportes publicitarios: vallas, monopostes, marquesinas, etc.';
COMMENT ON COLUMN soportes.tipo IS 'Tipo de soporte publicitario';
COMMENT ON COLUMN soportes.ubicacion IS 'Coordenadas GPS del soporte usando PostGIS';
COMMENT ON COLUMN soportes.estado IS 'Estado actual del soporte';
COMMENT ON COLUMN soportes.area_total IS 'Área total calculada automáticamente (ancho × alto)';

-- =====================================================
-- TABLA: cotizaciones
-- =====================================================
CREATE TABLE cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_cotizacion VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL,
    soporte_id UUID NOT NULL,
    empleado_id UUID NOT NULL, -- comercial que hizo la cotización
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_validez DATE NOT NULL,
    precio_estimado DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 21.00,
    iva_importe DECIMAL(10,2) GENERATED ALWAYS AS (precio_estimado * iva_porcentaje / 100) STORED,
    precio_total DECIMAL(10,2) GENERATED ALWAYS AS (precio_estimado + (precio_estimado * iva_porcentaje / 100)) STORED,
    condiciones TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'expirada')),
    fecha_respuesta DATE,
    notas_respuesta TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_cotizaciones_cliente 
        FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_cotizaciones_soporte 
        FOREIGN KEY (soporte_id) 
        REFERENCES soportes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_cotizaciones_empleado 
        FOREIGN KEY (empleado_id) 
        REFERENCES empleados(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE cotizaciones IS 'Cotizaciones enviadas a clientes para ocupar soportes publicitarios';
COMMENT ON COLUMN cotizaciones.estado IS 'Estado de la cotización: pendiente, aceptada, rechazada o expirada';

-- =====================================================
-- TABLA: contratos
-- =====================================================
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_contrato VARCHAR(50) UNIQUE NOT NULL,
    cliente_id UUID NOT NULL,
    soporte_id UUID NOT NULL,
    cotizacion_id UUID, -- referencia a la cotización aceptada
    empleado_id UUID NOT NULL, -- comercial responsable
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_mes DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 21.00,
    iva_importe DECIMAL(10,2) GENERATED ALWAYS AS (precio_mes * iva_porcentaje / 100) STORED,
    precio_total_mes DECIMAL(10,2) GENERATED ALWAYS AS (precio_mes + (precio_mes * iva_porcentaje / 100)) STORED,
    condiciones TEXT,
    condiciones_especiales TEXT,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'expirado', 'cancelado', 'suspendido')),
    fecha_cancelacion DATE,
    motivo_cancelacion TEXT,
    renovacion_automatica BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_contratos_cliente 
        FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_contratos_soporte 
        FOREIGN KEY (soporte_id) 
        REFERENCES soportes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_contratos_cotizacion 
        FOREIGN KEY (cotizacion_id) 
        REFERENCES cotizaciones(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_contratos_empleado 
        FOREIGN KEY (empleado_id) 
        REFERENCES empleados(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_fechas_contrato 
        CHECK (fecha_fin > fecha_inicio)
);

COMMENT ON TABLE contratos IS 'Contratos firmados con clientes para ocupar soportes publicitarios';
COMMENT ON COLUMN contratos.estado IS 'Estado del contrato: activo, expirado, cancelado o suspendido';
COMMENT ON COLUMN contratos.renovacion_automatica IS 'Si el contrato se renueva automáticamente al vencer';

-- =====================================================
-- TABLA: facturas
-- =====================================================
CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    contrato_id UUID NOT NULL,
    cliente_id UUID NOT NULL,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE NOT NULL,
    periodo_desde DATE NOT NULL,
    periodo_hasta DATE NOT NULL,
    importe_base DECIMAL(10,2) NOT NULL,
    iva_porcentaje DECIMAL(5,2) DEFAULT 21.00,
    iva_importe DECIMAL(10,2) GENERATED ALWAYS AS (importe_base * iva_porcentaje / 100) STORED,
    importe_total DECIMAL(10,2) GENERATED ALWAYS AS (importe_base + (importe_base * iva_porcentaje / 100)) STORED,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida', 'cancelada')),
    fecha_pago DATE,
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_facturas_contrato 
        FOREIGN KEY (contrato_id) 
        REFERENCES contratos(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_facturas_cliente 
        FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT chk_fechas_factura 
        CHECK (fecha_vencimiento >= fecha_emision AND periodo_hasta >= periodo_desde)
);

COMMENT ON TABLE facturas IS 'Facturas emitidas a clientes por contratos de publicidad';
COMMENT ON COLUMN facturas.estado IS 'Estado de la factura: pendiente, pagada, vencida o cancelada';
COMMENT ON COLUMN facturas.periodo_desde IS 'Fecha de inicio del período facturado';
COMMENT ON COLUMN facturas.periodo_hasta IS 'Fecha de fin del período facturado';

-- =====================================================
-- TABLA: inventario
-- =====================================================
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cantidad_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad_minima DECIMAL(10,2) DEFAULT 0,
    unidad VARCHAR(20) NOT NULL, -- metros, rollos, litros, unidades, etc.
    precio_unitario DECIMAL(10,2),
    proveedor VARCHAR(255),
    ubicacion_almacen VARCHAR(100),
    fecha_ultima_entrada DATE,
    fecha_ultima_salida DATE,
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'agotado')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE inventario IS 'Inventario de materiales: adhesivos, lonas, vinilos, tintas, etc.';
COMMENT ON COLUMN inventario.categoria IS 'Categoría del material: adhesivo, lona, vinilo, tinta, herramienta, etc.';
COMMENT ON COLUMN inventario.cantidad_minima IS 'Cantidad mínima para generar alertas de stock bajo';

-- =====================================================
-- TABLA: movimientos_inventario
-- =====================================================
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventario_id UUID NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad DECIMAL(10,2) NOT NULL,
    cantidad_anterior DECIMAL(10,2) NOT NULL,
    cantidad_nueva DECIMAL(10,2) NOT NULL,
    fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referencia VARCHAR(100), -- número de orden de trabajo, contrato, etc.
    motivo TEXT,
    empleado_id UUID,
    costo_unitario DECIMAL(10,2),
    costo_total DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * COALESCE(costo_unitario, 0)) STORED,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_movimientos_inventario 
        FOREIGN KEY (inventario_id) 
        REFERENCES inventario(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_movimientos_empleado 
        FOREIGN KEY (empleado_id) 
        REFERENCES empleados(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT chk_cantidad_movimiento 
        CHECK (cantidad > 0 AND cantidad_nueva = cantidad_anterior + 
               CASE WHEN tipo_movimiento = 'entrada' THEN cantidad 
                    WHEN tipo_movimiento = 'salida' THEN -cantidad 
                    ELSE 0 END)
);

COMMENT ON TABLE movimientos_inventario IS 'Control de entradas y salidas del inventario';
COMMENT ON COLUMN movimientos_inventario.tipo_movimiento IS 'Tipo de movimiento: entrada, salida o ajuste';
COMMENT ON COLUMN movimientos_inventario.referencia IS 'Referencia al documento que originó el movimiento';

-- =====================================================
-- TABLA: ordenes_trabajo
-- =====================================================
CREATE TABLE ordenes_trabajo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    soporte_id UUID,
    contrato_id UUID,
    empleado_id UUID NOT NULL, -- empleado asignado
    tipo_trabajo VARCHAR(50) NOT NULL CHECK (tipo_trabajo IN ('instalacion', 'impresion', 'mantenimiento', 'desmontaje', 'reparacion', 'limpieza')),
    prioridad VARCHAR(20) DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
    fecha_programada DATE NOT NULL,
    fecha_inicio TIMESTAMP WITH TIME ZONE,
    fecha_fin TIMESTAMP WITH TIME ZONE,
    horas_trabajadas DECIMAL(5,2),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada', 'pausada')),
    descripcion_trabajo TEXT NOT NULL,
    materiales_utilizados TEXT,
    costo_materiales DECIMAL(10,2),
    costo_mano_obra DECIMAL(10,2),
    costo_total DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(costo_materiales, 0) + COALESCE(costo_mano_obra, 0)) STORED,
    observaciones TEXT,
    fotos_antes TEXT[], -- array de URLs
    fotos_despues TEXT[], -- array de URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_ordenes_soporte 
        FOREIGN KEY (soporte_id) 
        REFERENCES soportes(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_ordenes_contrato 
        FOREIGN KEY (contrato_id) 
        REFERENCES contratos(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_ordenes_empleado 
        FOREIGN KEY (empleado_id) 
        REFERENCES empleados(id) 
        ON DELETE CASCADE
);

COMMENT ON TABLE ordenes_trabajo IS 'Órdenes de trabajo para instalación, mantenimiento y desmontaje de soportes';
COMMENT ON COLUMN ordenes_trabajo.tipo_trabajo IS 'Tipo de trabajo a realizar';
COMMENT ON COLUMN ordenes_trabajo.prioridad IS 'Prioridad de la orden de trabajo';

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para clientes
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_tipo ON clientes(tipo_cliente);
CREATE INDEX idx_clientes_estado ON clientes(estado);
CREATE INDEX idx_clientes_ciudad ON clientes(ciudad);

-- Índices para duenos_casa
CREATE INDEX idx_duenos_casa_email ON duenos_casa(email);
CREATE INDEX idx_duenos_casa_tipo ON duenos_casa(tipo_propietario);
CREATE INDEX idx_duenos_casa_estado ON duenos_casa(estado);

-- Índices para empleados
CREATE INDEX idx_empleados_email ON empleados(email);
CREATE INDEX idx_empleados_rol ON empleados(rol);
CREATE INDEX idx_empleados_estado ON empleados(estado);
CREATE INDEX idx_empleados_departamento ON empleados(departamento);

-- Índices para soportes
CREATE INDEX idx_soportes_codigo ON soportes(codigo);
CREATE INDEX idx_soportes_tipo ON soportes(tipo);
CREATE INDEX idx_soportes_estado ON soportes(estado);
CREATE INDEX idx_soportes_ciudad ON soportes(ciudad);
CREATE INDEX idx_soportes_dueno_casa ON soportes(dueno_casa_id);
CREATE INDEX idx_soportes_ubicacion ON soportes USING GIST(ubicacion);

-- Índices para cotizaciones
CREATE INDEX idx_cotizaciones_numero ON cotizaciones(numero_cotizacion);
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_soporte ON cotizaciones(soporte_id);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);
CREATE INDEX idx_cotizaciones_fecha_emision ON cotizaciones(fecha_emision);

-- Índices para contratos
CREATE INDEX idx_contratos_numero ON contratos(numero_contrato);
CREATE INDEX idx_contratos_cliente ON contratos(cliente_id);
CREATE INDEX idx_contratos_soporte ON contratos(soporte_id);
CREATE INDEX idx_contratos_estado ON contratos(estado);
CREATE INDEX idx_contratos_fecha_inicio ON contratos(fecha_inicio);
CREATE INDEX idx_contratos_fecha_fin ON contratos(fecha_fin);

-- Índices para facturas
CREATE INDEX idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX idx_facturas_contrato ON facturas(contrato_id);
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_fecha_emision ON facturas(fecha_emision);
CREATE INDEX idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);

-- Índices para inventario
CREATE INDEX idx_inventario_codigo ON inventario(codigo);
CREATE INDEX idx_inventario_categoria ON inventario(categoria);
CREATE INDEX idx_inventario_estado ON inventario(estado);
CREATE INDEX idx_inventario_proveedor ON inventario(proveedor);

-- Índices para movimientos_inventario
CREATE INDEX idx_movimientos_inventario_id ON movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_referencia ON movimientos_inventario(referencia);

-- Índices para ordenes_trabajo
CREATE INDEX idx_ordenes_numero ON ordenes_trabajo(numero_orden);
CREATE INDEX idx_ordenes_soporte ON ordenes_trabajo(soporte_id);
CREATE INDEX idx_ordenes_contrato ON ordenes_trabajo(contrato_id);
CREATE INDEX idx_ordenes_empleado ON ordenes_trabajo(empleado_id);
CREATE INDEX idx_ordenes_tipo ON ordenes_trabajo(tipo_trabajo);
CREATE INDEX idx_ordenes_estado ON ordenes_trabajo(estado);
CREATE INDEX idx_ordenes_fecha_programada ON ordenes_trabajo(fecha_programada);
CREATE INDEX idx_ordenes_prioridad ON ordenes_trabajo(prioridad);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas las tablas
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_duenos_casa_updated_at BEFORE UPDATE ON duenos_casa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soportes_updated_at BEFORE UPDATE ON soportes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cotizaciones_updated_at BEFORE UPDATE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON facturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordenes_trabajo_updated_at BEFORE UPDATE ON ordenes_trabajo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para generar números de cotización
CREATE OR REPLACE FUNCTION generar_numero_cotizacion()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    numero_cotizacion TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_cotizacion FROM 'COT-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM cotizaciones
    WHERE numero_cotizacion LIKE 'COT-' || year_part || '-%';
    
    numero_cotizacion := 'COT-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN numero_cotizacion;
END;
$$ LANGUAGE plpgsql;

-- Función para generar números de contrato
CREATE OR REPLACE FUNCTION generar_numero_contrato()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    numero_contrato TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_contrato FROM 'CTR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM contratos
    WHERE numero_contrato LIKE 'CTR-' || year_part || '-%';
    
    numero_contrato := 'CTR-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN numero_contrato;
END;
$$ LANGUAGE plpgsql;

-- Función para generar números de factura
CREATE OR REPLACE FUNCTION generar_numero_factura()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    numero_factura TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_factura FROM 'FAC-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM facturas
    WHERE numero_factura LIKE 'FAC-' || year_part || '-%';
    
    numero_factura := 'FAC-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN numero_factura;
END;
$$ LANGUAGE plpgsql;

-- Función para generar números de orden de trabajo
CREATE OR REPLACE FUNCTION generar_numero_orden()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num INTEGER;
    numero_orden TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM 'OT-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM ordenes_trabajo
    WHERE numero_orden LIKE 'OT-' || year_part || '-%';
    
    numero_orden := 'OT-' || year_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN numero_orden;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de soportes con información del propietario
CREATE VIEW vista_soportes_completa AS
SELECT 
    s.*,
    dc.nombre as propietario_nombre,
    dc.contacto as propietario_contacto,
    dc.telefono as propietario_telefono,
    dc.porcentaje_comision,
    dc.renta_fija,
    e.nombre as responsable_nombre,
    e.apellidos as responsable_apellidos
FROM soportes s
LEFT JOIN duenos_casa dc ON s.dueno_casa_id = dc.id
LEFT JOIN empleados e ON s.empleado_responsable_id = e.id;

-- Vista de contratos activos con información completa
CREATE VIEW vista_contratos_activos AS
SELECT 
    c.*,
    cl.nombre_comercial as cliente_nombre,
    cl.email as cliente_email,
    cl.telefono as cliente_telefono,
    s.codigo as soporte_codigo,
    s.nombre as soporte_nombre,
    s.tipo as soporte_tipo,
    s.ciudad as soporte_ciudad,
    e.nombre as comercial_nombre,
    e.apellidos as comercial_apellidos,
    (c.fecha_fin - CURRENT_DATE) as dias_restantes
FROM contratos c
JOIN clientes cl ON c.cliente_id = cl.id
JOIN soportes s ON c.soporte_id = s.id
JOIN empleados e ON c.empleado_id = e.id
WHERE c.estado = 'activo';

-- Vista de facturas pendientes
CREATE VIEW vista_facturas_pendientes AS
SELECT 
    f.*,
    c.numero_contrato,
    cl.nombre_comercial as cliente_nombre,
    cl.email as cliente_email,
    (f.fecha_vencimiento - CURRENT_DATE) as dias_vencimiento,
    CASE 
        WHEN f.fecha_vencimiento < CURRENT_DATE THEN 'vencida'
        WHEN f.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'por_vencer'
        ELSE 'normal'
    END as estado_vencimiento
FROM facturas f
JOIN contratos c ON f.contrato_id = c.id
JOIN clientes cl ON f.cliente_id = cl.id
WHERE f.estado IN ('pendiente', 'vencida');

-- Vista de inventario con stock bajo
CREATE VIEW vista_inventario_stock_bajo AS
SELECT 
    i.*,
    (i.cantidad_actual - i.cantidad_minima) as diferencia_stock
FROM inventario i
WHERE i.cantidad_actual <= i.cantidad_minima 
  AND i.estado = 'activo';

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

COMMENT ON SCHEMA public IS 'Esquema principal del ERP de Publicidad Vial Imagen - Sistema de gestión de vallas publicitarias';

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
