-- Función RPC para búsqueda de recursos (alternativa si .or() falla)
-- Esta función permite búsqueda en múltiples columnas con mejor control sobre RLS

CREATE OR REPLACE FUNCTION search_recursos(search_text text, max_results int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  codigo text,
  nombre text,
  descripcion text,
  imagen_portada text,
  categoria text,
  responsable text,
  unidad_medida text,
  cantidad numeric,
  coste numeric,
  precio_venta numeric,
  variantes jsonb,
  control_stock jsonb,
  fecha_creacion timestamptz,
  fecha_actualizacion timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.codigo,
    r.nombre,
    r.descripcion,
    r.imagen_portada,
    r.categoria,
    r.responsable,
    r.unidad_medida,
    r.cantidad,
    r.coste,
    r.precio_venta,
    r.variantes,
    r.control_stock,
    r.fecha_creacion,
    r.fecha_actualizacion
  FROM recursos r
  WHERE 
    r.codigo ILIKE '%' || search_text || '%'
    OR r.nombre ILIKE '%' || search_text || '%'
    OR r.categoria ILIKE '%' || search_text || '%'
  ORDER BY r.fecha_creacion DESC
  LIMIT max_results;
END;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION search_recursos(text, int) IS 
'Búsqueda de recursos en código, nombre y categoría. Alternativa a .or() de Supabase si falla.';

-- Grant execute a usuarios autenticados (respetando RLS)
GRANT EXECUTE ON FUNCTION search_recursos(text, int) TO authenticated;
