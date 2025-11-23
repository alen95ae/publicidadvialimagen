-- ============================================
-- HABILITAR RLS Y POLÍTICAS PARA COTIZACIONES
-- ============================================

-- Habilitar RLS en la tabla cotizacion
ALTER TABLE cotizacion ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (lectura) - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_read_cotizacion" ON cotizacion
FOR SELECT
USING (true);

-- Política para INSERT - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_insert_cotizacion" ON cotizacion
FOR INSERT
WITH CHECK (true);

-- Política para UPDATE - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_update_cotizacion" ON cotizacion
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para DELETE - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_delete_cotizacion" ON cotizacion
FOR DELETE
USING (true);

-- ============================================
-- HABILITAR RLS Y POLÍTICAS PARA COTIZACION_LINEAS
-- ============================================

-- Habilitar RLS en la tabla cotizacion_lineas
ALTER TABLE cotizacion_lineas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (lectura) - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_read_cotizacion_lineas" ON cotizacion_lineas
FOR SELECT
USING (true);

-- Política para INSERT - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_insert_cotizacion_lineas" ON cotizacion_lineas
FOR INSERT
WITH CHECK (true);

-- Política para UPDATE - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_update_cotizacion_lineas" ON cotizacion_lineas
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para DELETE - permitir acceso completo
CREATE POLICY IF NOT EXISTS "allow_delete_cotizacion_lineas" ON cotizacion_lineas
FOR DELETE
USING (true);

-- Nota: Estas políticas permiten acceso completo.
-- Si usas Service Role Key en el servidor, estas políticas no se aplican
-- pero son útiles si en algún momento usas el anon key o necesitas acceso desde el cliente



