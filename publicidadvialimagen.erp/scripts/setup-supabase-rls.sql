-- ============================================
-- CONFIGURACIÓN RLS PARA TABLA SOPORTES
-- ============================================

-- 1. Habilitar RLS en la tabla soportes
ALTER TABLE soportes ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas para permitir acceso completo con Service Role Key
-- (El Service Role Key bypass RLS, pero estas políticas son para el anon key si se usa)

-- Política para SELECT (lectura)
CREATE POLICY "allow_read_all" ON soportes
FOR SELECT
USING (true);

-- Política para INSERT
CREATE POLICY "allow_insert_all" ON soportes
FOR INSERT
WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "allow_update_all" ON soportes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "allow_delete_all" ON soportes
FOR DELETE
USING (true);

-- ============================================
-- VERIFICAR COLUMNAS DE LA TABLA
-- ============================================
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'soportes'
ORDER BY ordinal_position;

