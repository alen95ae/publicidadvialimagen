# Script de Reconstrucción de Variantes de Productos

Este script reconstruye las variantes de productos que tienen receta pero el campo `variante` está vacío `[]` en Supabase.

## Problema

Algunos productos tienen recursos con variantes en su receta, pero el campo `variante` en la tabla `productos` está vacío. Esto hace que las variantes no se muestren correctamente.

## Solución

El script:
1. Busca todos los productos que tienen receta pero variante vacío
2. Reconstruye las variantes desde los recursos de la receta
3. Actualiza el campo `variante` en la tabla `productos`
4. Regenera las combinaciones en `producto_variantes`

## Uso

### Opción 1: Ejecutar el script directamente

```bash
cd publicidadvialimagen.erp
npx tsx scripts/reconstruir-variantes-productos.ts
```

### Opción 2: Usar la API endpoint

```bash
# Reconstruir variantes de un producto específico
curl -X POST http://localhost:3000/api/productos/reconstruir-variantes \
  -H "Content-Type: application/json" \
  -d '{"producto_id": "uuid-del-producto"}'

# Reconstruir variantes de todos los productos
curl -X POST http://localhost:3000/api/productos/reconstruir-variantes \
  -H "Content-Type: application/json" \
  -d '{"todos": true}'
```

## Mejoras Implementadas

1. **Carga automática**: Al cargar un producto, si tiene receta pero no variantes, se detecta y se pueden regenerar automáticamente.

2. **Sincronización en guardado**: Al guardar un producto, se sincronizan automáticamente las variantes usando `syncProductVariants`.

3. **Compatibilidad**: El código ahora verifica tanto `variante` (singular) como `variantes` (plural) para compatibilidad.

## Notas

- El script solo procesa productos que tienen receta válida
- Solo actualiza productos que NO tienen variantes guardadas (para no sobrescribir datos existentes)
- Solo procesa productos cuyos recursos tienen variantes definidas
- El proceso es seguro y no elimina datos existentes

