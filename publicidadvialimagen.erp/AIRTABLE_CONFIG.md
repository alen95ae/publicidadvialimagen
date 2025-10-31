# Configuración Requerida en Airtable

## Tabla: Recursos

### Campos Requeridos en Airtable:
- **Código** (tipo: Single line text)
- **Nombre** (tipo: Single line text)
- **Descripción** (tipo: Long text) - Opcional
- **Categoría** (tipo: Single select)
- **Responsable** (tipo: Single line text)
- **Unidad de Medida** (tipo: Single select)
- **Stock** (tipo: Number)
- **Coste** (tipo: Number o Currency)
- **Fecha Creación** (tipo: Date o Formula)
- **Fecha Actualización** (tipo: Date o Formula)

**NOTA**: El campo "Precio Venta" NO se usa actualmente. Si existe en tu base, puedes eliminarlo o dejarlo.

### Campo: Unidad de Medida
**Tipo de campo**: Single select
**Opciones requeridas** (exactamente como se muestran):
- `m²` (metros cuadrados con superíndice - **MUY IMPORTANTE**)
- `kg`
- `m`
- `L`
- `unidad`
- `hora`
- `km`

**NOTA IMPORTANTE**: Para metros cuadrados, usa `m²` (con el 2 en superíndice), NO `m2` (con 2 normal).
El sistema convierte automáticamente entre `m2` (frontend) ↔ `m²` (Airtable).

### Campo: Categoría
**Tipo de campo**: Single select
**Opciones requeridas**:
- `Insumos`
- `Mano de Obra`

## Instrucciones

### 1. Verificar campo "Unidad de Medida":
1. Abre tu base de Airtable
2. Ve a la tabla "Recursos"
3. Haz clic en la columna "Unidad de Medida"
4. Verifica que el tipo sea "Single select"
5. Asegúrate de que existan EXACTAMENTE estas opciones:
   - **m²** (metros cuadrados CON superíndice - usa ² no 2)
   - kg
   - m
   - L
   - unidad
   - hora
   - km

**⚠️ IMPORTANTE**: Si actualmente tienes "m2" (con 2 normal), cámbialo a "m²" (con 2 en superíndice). 
Para escribir ² en Mac: Option + 2. En Windows: Alt + 0178.

### 2. Si falta alguna opción:
1. Haz clic en "Customize field type"
2. Agrega las opciones faltantes manualmente
3. Guarda los cambios

### 3. Alternativa (si prefieres texto libre):
Si quieres poder usar cualquier unidad sin restricciones:
1. Cambia el tipo de campo de "Single select" a "Single line text"
2. Esto permitirá cualquier valor sin errores de permisos

## Notas importantes:
- Las opciones son **case-sensitive**: `m2` ≠ `M2`
- No uses espacios extras: `m2` ≠ ` m2 `
- El código ya limpia automáticamente comillas y escapes
- **MUY IMPORTANTE**: Usa `m²` (superíndice) en Airtable, el sistema lo convierte automáticamente

## Conversión automática:
El sistema convierte automáticamente:
- **De Airtable → Frontend**: `m²` se muestra como `m2` en los dropdowns
- **De Frontend → Airtable**: `m2` se envía como `m²` a Airtable

Esto permite usar `m2` en el código (más fácil de escribir) mientras que Airtable usa `m²` (más correcto visualmente).

