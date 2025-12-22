-- Seed: Insertar plantillas contables iniciales
-- Esta migración inserta las plantillas base: Compra con Crédito Fiscal y Venta con Débito Fiscal

-- Insertar configuración de cuentas IVA (valores por defecto, deben ajustarse según plan de cuentas)
INSERT INTO contabilidad_config (key, value, descripcion) VALUES
  ('IVA_CREDITO_CUENTA', '116001001', 'Cuenta de IVA Crédito Fiscal')
ON CONFLICT (key) DO UPDATE SET value = '116001001';

INSERT INTO contabilidad_config (key, value, descripcion) VALUES
  ('IVA_DEBITO_CUENTA', '213001001', 'Cuenta de IVA Débito Fiscal')
ON CONFLICT (key) DO UPDATE SET value = '213001001';

-- Plantilla 1: Compra con Crédito Fiscal
INSERT INTO plantillas_contables (codigo, nombre, descripcion, tipo_comprobante, activa) VALUES
  ('COMPRA_CF', 'Compra con Crédito Fiscal', 'Genera comprobante de compra con IVA crédito fiscal. Líneas: Gasto (DEBE), IVA Crédito (DEBE), Proveedor (HABER)', 'Egreso', true)
ON CONFLICT (codigo) DO NOTHING
RETURNING id;

-- Obtener el ID de la plantilla COMPRA_CF (si se insertó)
DO $$
DECLARE
  plantilla_compra_id UUID;
BEGIN
  SELECT id INTO plantilla_compra_id FROM plantillas_contables WHERE codigo = 'COMPRA_CF';
  
  IF plantilla_compra_id IS NOT NULL THEN
    -- Detalles de Compra con Crédito Fiscal
    INSERT INTO plantillas_contables_detalle (plantilla_id, orden, rol, lado, porcentaje, permite_seleccionar_cuenta, permite_auxiliar, cuenta_fija) VALUES
      -- Línea 1: Gasto (DEBE) - El usuario selecciona la cuenta
      (plantilla_compra_id, 1, 'GASTO', 'DEBE', NULL, true, false, NULL),
      -- Línea 2: IVA Crédito Fiscal (DEBE) - Cuenta fija desde config
      (plantilla_compra_id, 2, 'IVA_CREDITO', 'DEBE', 13.00, false, false, NULL),
      -- Línea 3: Proveedor (HABER) - Permite auxiliar y selección de cuenta
      (plantilla_compra_id, 3, 'PROVEEDOR', 'HABER', NULL, true, true, NULL)
    ON CONFLICT (plantilla_id, orden) DO NOTHING;
  END IF;
END $$;

-- Plantilla 2: Venta con Débito Fiscal
INSERT INTO plantillas_contables (codigo, nombre, descripcion, tipo_comprobante, activa) VALUES
  ('VENTA_DF', 'Venta con Débito Fiscal', 'Genera comprobante de venta con IVA débito fiscal. Líneas: Cliente (DEBE), Ingreso (HABER), IVA Débito (HABER)', 'Ingreso', true)
ON CONFLICT (codigo) DO NOTHING
RETURNING id;

-- Obtener el ID de la plantilla VENTA_DF (si se insertó)
DO $$
DECLARE
  plantilla_venta_id UUID;
BEGIN
  SELECT id INTO plantilla_venta_id FROM plantillas_contables WHERE codigo = 'VENTA_DF';
  
  IF plantilla_venta_id IS NOT NULL THEN
    -- Detalles de Venta con Débito Fiscal
    INSERT INTO plantillas_contables_detalle (plantilla_id, orden, rol, lado, porcentaje, permite_seleccionar_cuenta, permite_auxiliar, cuenta_fija) VALUES
      -- Línea 1: Cliente (DEBE) - Permite auxiliar y selección de cuenta
      (plantilla_venta_id, 1, 'CLIENTE', 'DEBE', NULL, true, true, NULL),
      -- Línea 2: Ingreso (HABER) - El usuario selecciona la cuenta
      (plantilla_venta_id, 2, 'INGRESO', 'HABER', NULL, true, false, NULL),
      -- Línea 3: IVA Débito Fiscal (HABER) - Cuenta fija desde config
      (plantilla_venta_id, 3, 'IVA_DEBITO', 'HABER', 13.00, false, false, NULL)
    ON CONFLICT (plantilla_id, orden) DO NOTHING;
  END IF;
END $$;

