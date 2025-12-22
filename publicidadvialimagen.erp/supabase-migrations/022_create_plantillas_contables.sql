-- Migración: Crear tablas para plantillas contables
-- Esta migración crea las tablas necesarias para el sistema de plantillas contables

-- Tabla de configuración contable
CREATE TABLE IF NOT EXISTS contabilidad_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de plantillas contables
CREATE TABLE IF NOT EXISTS plantillas_contables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_comprobante TEXT NOT NULL CHECK (tipo_comprobante IN ('Diario', 'Ingreso', 'Egreso', 'Traspaso', 'Ctas por Pagar')),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de detalles de plantillas contables
CREATE TABLE IF NOT EXISTS plantillas_contables_detalle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID NOT NULL REFERENCES plantillas_contables(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('GASTO', 'INGRESO', 'PROVEEDOR', 'CLIENTE', 'CAJA_BANCO', 'IVA_CREDITO', 'IVA_DEBITO')),
  lado TEXT NOT NULL CHECK (lado IN ('DEBE', 'HABER')),
  porcentaje NUMERIC(5, 2) NULL, -- Para IVA: 13.00
  permite_seleccionar_cuenta BOOLEAN DEFAULT false,
  cuenta_fija TEXT NULL, -- Si alguna línea usa una cuenta fija de plan_cuentas
  permite_auxiliar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plantilla_id, orden)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plantillas_contables_codigo ON plantillas_contables(codigo);
CREATE INDEX IF NOT EXISTS idx_plantillas_contables_activa ON plantillas_contables(activa);
CREATE INDEX IF NOT EXISTS idx_plantillas_contables_detalle_plantilla_id ON plantillas_contables_detalle(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_plantillas_contables_detalle_orden ON plantillas_contables_detalle(plantilla_id, orden);

-- Comentarios
COMMENT ON TABLE contabilidad_config IS 'Configuración general de contabilidad (cuentas IVA, etc.)';
COMMENT ON TABLE plantillas_contables IS 'Plantillas para generar comprobantes contables automáticamente';
COMMENT ON TABLE plantillas_contables_detalle IS 'Detalles de cada plantilla (líneas contables)';

COMMENT ON COLUMN plantillas_contables.codigo IS 'Código único de la plantilla (ej: COMPRA_CF, VENTA_DF)';
COMMENT ON COLUMN plantillas_contables_detalle.rol IS 'Rol contable: GASTO, INGRESO, PROVEEDOR, CLIENTE, CAJA_BANCO, IVA_CREDITO, IVA_DEBITO';
COMMENT ON COLUMN plantillas_contables_detalle.lado IS 'Lado contable: DEBE o HABER';
COMMENT ON COLUMN plantillas_contables_detalle.porcentaje IS 'Porcentaje para cálculos (ej: 13 para IVA)';
COMMENT ON COLUMN plantillas_contables_detalle.cuenta_fija IS 'Cuenta fija del plan de cuentas si no se permite seleccionar';
COMMENT ON COLUMN plantillas_contables_detalle.permite_seleccionar_cuenta IS 'Si el usuario puede seleccionar la cuenta en esta línea';
COMMENT ON COLUMN plantillas_contables_detalle.permite_auxiliar IS 'Si esta línea permite usar auxiliar (proveedor/cliente/banco)';

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_plantillas_contables_updated_at
  BEFORE UPDATE ON plantillas_contables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plantillas_contables_detalle_updated_at
  BEFORE UPDATE ON plantillas_contables_detalle
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

