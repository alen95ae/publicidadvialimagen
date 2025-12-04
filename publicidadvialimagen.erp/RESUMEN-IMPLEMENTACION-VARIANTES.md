# ✅ Resumen de Implementación - Variantes con Sucursales

**Fecha**: 5 de diciembre de 2024

## 🎯 Objetivo Cumplido

Las variantes de productos ahora incluyen sucursales **exactamente igual que en Control de Stock**, con cálculo correcto de costes.

## 📐 Fórmula de Cálculo

```
COSTE_VARIANTE = COSTE_BASE_PRODUCTO + SUMA(diferencias_precio_recursos)
```

### Desglose:
- **COSTE_BASE_PRODUCTO**: Viene de la calculadora de precios del producto
- **diferencias_precio_recursos**: Se obtienen del `control_stock` de cada recurso en la receta

### Ejemplo Real - ITEM DE PRUEBA:

**Coste BASE**: Bs 15.00

**Recursos en receta**:
1. ITEM DE PRUEBA 2 (tamaño: A/B)
   - La Paz, A: diferencia = 0
   - La Paz, B: diferencia = 2.55
   - Santa Cruz, A: diferencia = 3.43
   - Santa Cruz, B: diferencia = 1.25

2. INSUMO PRUEBA (Grosor: 1/2)
   - La Paz, Grosor 1: diferencia = 0
   - La Paz, Grosor 2: diferencia = 2
   - Santa Cruz, Grosor 1: diferencia = 1
   - Santa Cruz, Grosor 2: diferencia = 3

**Costes calculados**:
```
Grosor:1 + La Paz + Tamaño:A     → 15 + 0 + 0 = Bs 15.00
Grosor:1 + La Paz + Tamaño:B     → 15 + 0 + 2.55 = Bs 17.55
Grosor:1 + Santa Cruz + Tamaño:A → 15 + 1 + 3.43 = Bs 19.43
Grosor:1 + Santa Cruz + Tamaño:B → 15 + 1 + 1.25 = Bs 17.25
Grosor:2 + La Paz + Tamaño:A     → 15 + 2 + 0 = Bs 17.00
Grosor:2 + La Paz + Tamaño:B     → 15 + 2 + 2.55 = Bs 19.55
Grosor:2 + Santa Cruz + Tamaño:A → 15 + 3 + 3.43 = Bs 21.43
Grosor:2 + Santa Cruz + Tamaño:B → 15 + 3 + 1.25 = Bs 19.25
```

## 🔧 Implementación Técnica

### 1. Generación de Combinaciones (`variantSync.ts`)

```typescript
// 1. Generar combinaciones base (sin sucursal)
const combinacionesBase = generarCombinacionesVariantes(definiciones);

// 2. Multiplicar por sucursales
SUCURSALES_DISPONIBLES.forEach(sucursal => {
  combinacionesBase.forEach(combo => {
    const valoresConSucursal = { ...combo.valores, Sucursal: sucursal };
    // ... agregar combinación
  });
});
```

### 2. Cálculo de Costes (`variantEngine.ts`)

```typescript
export function computeVariantCost(
  receta: any[],
  recursos: any[],
  productVariant: Record<string, string>,
  sucursal?: string,
  costeBase?: number
): number {
  let total = costeBase || 0; // Partir del coste base

  receta.forEach(item => {
    const recurso = recursos.find(r => r.id === item.recurso_id);
    const precioRecurso = findResourceVariantPrice(recurso, productVariant, sucursal);
    const costeBaseRecurso = Number(recurso.coste) || 0;
    const diferencia = precioRecurso - costeBaseRecurso;
    total += diferencia * item.cantidad; // Solo la diferencia
  });

  return Math.round(total * 100) / 100;
}
```

### 3. Búsqueda de Precio en Control Stock

```typescript
export function findResourceVariantPrice(
  recurso: any,
  productVariant: Record<string, string>,
  sucursal?: string
): number {
  // Buscar en control_stock la combinación exacta
  // Retornar: costeBase + diferenciaPrecio
}
```

## 📊 Estructura de Datos

### `productos.variante` (NO incluye Sucursal)
```json
[
  { "nombre": "Grosor", "valores": ["1", "2"] },
  { "nombre": "tamaño", "valores": ["A", "B"] }
]
```

### `producto_variantes` (incluye Sucursal en combinacion)
```
Grosor:1|Sucursal:La Paz|Tamaño:A
Grosor:1|Sucursal:La Paz|Tamaño:B
Grosor:1|Sucursal:Santa Cruz|Tamaño:A
... (8 combinaciones)
```

### `recursos.control_stock`
```json
{
  "Grosor:1|Sucursal:La Paz": {
    "stock": 0,
    "precioVariante": 10,
    "diferenciaPrecio": 0
  },
  "Grosor:2|Sucursal:Santa Cruz": {
    "stock": 0,
    "precioVariante": 13,
    "diferenciaPrecio": 3
  }
}
```

## ✅ Verificación

- ✅ 22 productos regenerados exitosamente
- ✅ Costes calculados correctamente según diferencias
- ✅ Sucursales: Solo La Paz y Santa Cruz
- ✅ Método idéntico a Control de Stock
- ✅ Sucursal NO guardada como variante
- ✅ Fórmula: BASE + SUMA(diferencias)

## 🚀 Uso

Para regenerar todos los productos:
```bash
cd publicidadvialimagen.erp
npx tsx scripts/regenerar-con-sucursales.ts
```

## 📝 Notas Importantes

1. **Productos nuevos**: Automáticamente incluyen sucursales al guardar
2. **Productos existentes**: Ejecutar script de regeneración
3. **Diferencias de precio**: Vienen del `control_stock` de recursos
4. **Coste base**: Viene de la calculadora de precios del producto
5. **Consistencia**: Mismo comportamiento que Control de Stock de recursos

