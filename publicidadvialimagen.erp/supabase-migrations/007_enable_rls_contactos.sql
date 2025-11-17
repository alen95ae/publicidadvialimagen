-- ============================================
-- HABILITAR RLS Y POLÍTICAS PARA CONTACTOS
-- ============================================

-- Habilitar RLS en la tabla contactos
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (lectura) - permitir a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "allow_read_contactos" ON contactos
FOR SELECT
USING (true);

-- Política para INSERT - permitir a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "allow_insert_contactos" ON contactos
FOR INSERT
WITH CHECK (true);

-- Política para UPDATE - permitir a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "allow_update_contactos" ON contactos
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para DELETE - permitir a todos los usuarios autenticados
CREATE POLICY IF NOT EXISTS "allow_delete_contactos" ON contactos
FOR DELETE
USING (true);

-- Nota: Estas políticas permiten acceso completo.
-- Si usas Service Role Key en el servidor, estas políticas no se aplican
-- pero son útiles si en algún momento usas el anon key o necesitas acceso desde el cliente

