SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'plantillas_contables_detalle'
ORDER BY ordinal_position;
