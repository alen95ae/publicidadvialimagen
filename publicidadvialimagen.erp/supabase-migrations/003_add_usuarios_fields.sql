-- Agregar campos faltantes a la tabla usuarios
-- Ejecutar este script en Supabase SQL Editor

-- Agregar campo password_hash (texto, no nulo para nuevos usuarios, nullable para existentes)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Agregar campo nombre (texto, nullable)
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS nombre TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN usuarios.password_hash IS 'Hash de la contraseña del usuario (bcrypt)';
COMMENT ON COLUMN usuarios.nombre IS 'Nombre completo del usuario';

