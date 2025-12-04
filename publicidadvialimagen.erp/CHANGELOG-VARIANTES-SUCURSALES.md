# Changelog: Variantes con Sucursales

**Fecha**: 5 de diciembre de 2024  
**Versión**: 2.0

## 🎯 Cambio Principal

Las **Sucursales** (La Paz y Santa Cruz) ahora se incluyen en las combinaciones de variantes de productos, **igual que en el control de stock de recursos**, pero **sin guardar "Sucursal" como una variante más** en `productos.variante`.

### Método Utilizado

Igual que en Control de Stock (`app/panel/ajustes-inventario/page.tsx`):
1. Se generan las combinaciones de las variantes del producto (ej: Grosor × Tamaño)
2. Se multiplican por las 2 sucursales (La Paz y Santa Cruz)
3. Los costes se calculan con la sucursal específica

**Resultado**: Un producto con 2 variantes (Grosor: 1,2 y Tamaño: A,B) genera **8 combinaciones** (4 × 2 sucursales)

## ✨ Mejoras Implementadas

### 1. Variantes de Productos con Sucursales

Antes:
- Un producto con 2 variantes (Grosor: 1,2 y Tamaño: A,B) generaba **4 combinaciones**
- Las sucursales no estaban incluidas en las variantes

Ahora:
- El mismo producto genera **8 combinaciones** (4 × 2 sucursales)
- Cada combinación incluye la sucursal: `Grosor:1|Sucursal:La Paz|Tamaño:A`

### 2. Sucursales Disponibles

- **La Paz**
- **Santa Cruz**

(Las mismas que en control de stock de recursos)

### 3. Cálculo de Costes por Sucursal

**Fórmula**: `COSTE_VARIANTE = COSTE_BASE_PRODUCTO + SUMA(diferencias_precio_recursos)`

Los costes se calculan automáticamente:
1. Se parte del **coste base del producto** (calculadora de precios)
2. Se suman las **diferencias de precio** de cada recurso en la receta
3. Las diferencias vienen del `control_stock` de cada recurso
4. Se consideran las variantes específicas y la sucursal

**Ejemplo**: 
- Coste base producto: Bs 15
- Recurso 1 (Santa Cruz, tamaño A): diferencia +3.43
- Recurso 2 (Santa Cruz, Grosor 1): diferencia +1
- **Total**: 15 + 3.43 + 1 = **Bs 19.43**

### 4. Consistencia con Control de Stock

Ahora los productos tienen el mismo comportamiento que los recursos:
- Recursos: Control de stock por sucursal y variante
- Productos: Variantes que incluyen sucursal

## 📦 Scripts Actualizados

### `lib/variantes/variantSync.ts`
- Agregada constante `SUCURSALES_DISPONIBLES`
- Las sucursales se agregan automáticamente como dimensión de variante
- El cálculo de costes considera la sucursal específica

### Nuevos Scripts

#### `scripts/regenerar-con-sucursales.ts`
Regenera TODAS las variantes de productos incluyendo sucursales.

```bash
npx tsx scripts/regenerar-con-sucursales.ts
```

## 🔄 Migración Realizada

Se ejecutó la regeneración masiva:
- **22 productos** procesados
- **22 productos** actualizados exitosamente
- **0 errores**

### Resultado

Productos que antes tenían 4 combinaciones ahora tienen 8 (con 2 sucursales).

Ejemplo - ITEM DE PRUEBA:
- **Antes**: 4 combinaciones (sin sucursales)
- **Ahora**: 8 combinaciones (con La Paz y Santa Cruz)

## 📊 Impacto en la Base de Datos

### Tabla `productos`
El campo `variante` **NO incluye Sucursal** (se maneja igual que en control de stock):
```json
[
  { "nombre": "Grosor", "valores": ["1", "2"] },
  { "nombre": "Tamaño", "valores": ["A", "B"] }
]
```
*(Sin dimensión "Sucursal", se multiplica aparte)*

### Tabla `producto_variantes`
Número de registros multiplicado por 2 (una por cada sucursal: La Paz y Santa Cruz).

## 🎨 Frontend

El frontend mostrará automáticamente:
- Columna "Sucursal" en la tabla de variantes
- Filtros por sucursal
- Costes y precios específicos por sucursal

## ⚠️ Consideraciones

1. **Productos existentes**: Ejecutar `regenerar-con-sucursales.ts` para actualizar
2. **Productos nuevos**: Automáticamente incluyen sucursales al guardar
3. **Performance**: El número de combinaciones se multiplica por 2 (La Paz y Santa Cruz)
4. **Costes**: Se calculan correctamente por sucursal usando `control_stock` de recursos
5. **Consistencia**: Las combinaciones son idénticas a las de control de stock de recursos

## 🔗 Referencias

- `lib/variantes/variantSync.ts` - Lógica principal
- `lib/variantes/variantEngine.ts` - Cálculo de costes con sucursal
- `scripts/README-RECONSTRUIR-VARIANTES.md` - Documentación de scripts

