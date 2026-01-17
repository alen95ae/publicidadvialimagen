-- Migración: Agregar columna company_id a la tabla contactos
-- Esta columna almacena el ID del contacto empresa cuando el tipo es Individual

-- Agregar columna company_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contactos' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.contactos 
    ADD COLUMN company_id UUID NULL;
    
    -- Agregar comentario
    COMMENT ON COLUMN public.contactos.company_id IS 'ID del contacto empresa asociado (para contactos Individual)';
    
    -- Crear índice para mejorar las consultas
    CREATE INDEX IF NOT EXISTS idx_contactos_company_id ON public.contactos(company_id);
  END IF;
END $$;
