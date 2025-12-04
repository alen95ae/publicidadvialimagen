# Scripts de Reconstrucción de Variantes de Productos

Estos scripts reconstruyen las variantes de productos desde sus recursos cuando faltan combinaciones en `producto_variantes`.

## Problema

Algunos productos tienen:
1. Definiciones de variantes en `productos.variante` (nombres y valores)
2. Pero NO tienen registros en `producto_variantes` (combinaciones generadas)

Esto hace que la tabla de variantes se muestre vacía en el frontend.

## Scripts Disponibles

### 1. `reconstruir-variantes-productos.ts` (Diagnóstico)
Busca productos con recursos que tienen variantes pero sin definiciones en `productos.variante`.

```bash
cd publicidadvialimagen.erp
npx tsx scripts/reconstruir-variantes-productos.ts
```

### 2. `regenerar-todas-variantes.ts` (Regeneración de Combinaciones)
Busca productos que tienen `productos.variante` definido pero sin registros en `producto_variantes` y los regenera.

```bash
cd publicidadvialimagen.erp
npx tsx scripts/regenerar-todas-variantes.ts
```

### 3. `regenerar-con-sucursales.ts` ⭐ (Regeneración TOTAL con Sucursales)
Regenera TODAS las combinaciones de TODOS los productos, incluyendo sucursales como dimensión de variante.

```bash
cd publicidadvialimagen.erp
npx tsx scripts/regenerar-con-sucursales.ts
```

**Este es el script principal** para regenerar todo el sistema con el nuevo formato que incluye sucursales.

### 3. API Endpoint

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

## Flujo de Variantes

1. **Definición**: Los recursos tienen variantes en `recursos.variantes` (JSONB)
2. **Importación**: Al editar un producto, se importan variantes de recursos a `productos.variante`
3. **Generación**: Al guardar el producto, se generan combinaciones base (producto cartesiano)
4. **Sucursales**: Se multiplican las combinaciones por sucursales (La Paz, Santa Cruz) - igual que en control de stock
5. **Cálculo**: Los costes se calculan con la sucursal específica
6. **Visualización**: El frontend muestra las combinaciones desde `producto_variantes`

### Ejemplo

Si un producto tiene:
- Grosor: [1, 2]
- Tamaño: [A, B]

**Paso 1**: Generar combinaciones base (4):
- Grosor:1|Tamaño:A
- Grosor:1|Tamaño:B
- Grosor:2|Tamaño:A
- Grosor:2|Tamaño:B

**Paso 2**: Multiplicar por sucursales (× 2), generando **8 combinaciones**:
- Grosor:1|Sucursal:La Paz|Tamaño:A
- Grosor:1|Sucursal:La Paz|Tamaño:B
- Grosor:1|Sucursal:Santa Cruz|Tamaño:A
- Grosor:1|Sucursal:Santa Cruz|Tamaño:B
- Grosor:2|Sucursal:La Paz|Tamaño:A
- Grosor:2|Sucursal:La Paz|Tamaño:B
- Grosor:2|Sucursal:Santa Cruz|Tamaño:A
- Grosor:2|Sucursal:Santa Cruz|Tamaño:B

**(Igual que en Control de Stock de recursos)**

## Mejoras Implementadas

1. **Sincronización automática**: Al guardar un producto, se sincronizan automáticamente las variantes usando `syncProductVariants`.

2. **Normalización robusta**: Acepta tanto `valores` como `posibilidades` en las variantes de recursos.

3. **Compatibilidad**: Verifica tanto `variante` (singular) como `variantes` (plural).

4. **Regeneración manual**: Botón "Regenerar Variantes" en el frontend para forzar regeneración.

## Notas

- El script `regenerar-todas-variantes.ts` solo procesa productos que tienen definiciones pero no combinaciones
- No sobrescribe datos existentes (salta productos que ya tienen combinaciones)
- Los costes se calculan automáticamente basándose en la receta y recursos
- La tabla `producto_variantes` NO tiene columna `valores`, solo `combinacion` (formato: "Nombre:Valor|Nombre:Valor")

