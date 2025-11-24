-- Agregar columna calculadora_precios_override a producto_variantes
-- Esta columna almacena la configuración completa de la calculadora de precios para cada variante

ALTER TABLE producto_variantes
ADD COLUMN IF NOT EXISTS calculadora_precios_override JSONB;

-- Comentario
COMMENT ON COLUMN producto_variantes.calculadora_precios_override IS 'Configuración completa de la calculadora de precios para esta variante (JSONB con priceRows, totalPrice, utilidadReal, objetivoUtilidadReal)';

