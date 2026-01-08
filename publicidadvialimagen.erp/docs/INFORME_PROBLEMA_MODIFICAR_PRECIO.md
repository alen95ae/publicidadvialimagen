# Informe: Problema con Permiso "Modificar Precio Cotización"

## Problema Reportado

1. ✅ **PRO-001 funciona correctamente**: El campo precio está habilitado para productos PRO-001
2. ❌ **Campo precio bloqueado**: El campo precio sigue bloqueado para otros productos aunque el usuario tenga el permiso activado
3. ❌ **Validaciones bloquean aprobación**: No permite aprobar cotizaciones con precio menor aunque el usuario tenga el permiso

## Análisis del Código

### Implementación Actual

#### 1. Campo Precio (nuevo/page.tsx y editar/[id]/page.tsx)
```typescript
const precioHabilitado = tieneFuncionTecnica("modificar precio cotización") || esPRO001
<Input disabled={!precioHabilitado} />
```

#### 2. Validaciones de Precio (handleGuardar)
```typescript
const puedeModificarPrecio = tieneFuncionTecnica("modificar precio cotización")
if (!puedeModificarPrecio && producto.total < subtotalCalculado * 0.99) {
  // Bloquear guardado
}
```

### Flujo de Permisos

1. **API `/api/permisos`** (route.ts):
   - Obtiene permisos del usuario desde `rol_permisos`
   - Normaliza acciones con `normalizarAccion()` (trim + colapso espacios)
   - Retorna matriz: `{ tecnico: { "modificar precio cotización": true } }`

2. **Hook `usePermisos`** (use-permisos.ts):
   - Carga permisos desde `/api/permisos`
   - Función `tieneFuncionTecnica()`:
     - Si `loading = true`, retorna `false`
     - Normaliza acción: `.trim().replace(/\s+/g, " ")`
     - Busca en `permisos["tecnico"][accionNormalizada]`
     - Retorna `true` solo si el valor es exactamente `true`

## Posibles Causas

### Causa 1: Nombre del Permiso No Coincide Exactamente
**Probabilidad: ALTA**

El permiso en la base de datos puede tener:
- Espacios diferentes (múltiples espacios, espacios al inicio/final)
- Acentos diferentes ("cotización" vs "cotizacion")
- Mayúsculas/minúsculas diferentes
- Nombre completamente diferente

**Evidencia:**
- La normalización solo colapsa espacios múltiples, no normaliza acentos
- Si el permiso en BD es "Modificar Precio Cotizacion" (sin tilde), no coincidirá con "modificar precio cotización"

### Causa 2: Permisos Aún Cargando (Loading State)
**Probabilidad: MEDIA**

Cuando el componente se renderiza, los permisos pueden estar cargando:
```typescript
if (loading) {
  return false; // ❌ Retorna false mientras carga
}
```

**Evidencia:**
- El campo precio se evalúa en el render
- Si `loading = true`, el campo queda bloqueado
- Una vez cargados los permisos, el componente no se re-renderiza automáticamente

### Causa 3: Permiso No Asignado al Rol
**Probabilidad: BAJA** (si el usuario confirma que está activado)

El permiso puede no estar asignado en `rol_permisos`:
- El permiso existe en la tabla `permisos`
- Pero no está en `rol_permisos` para el rol del usuario

### Causa 4: Contexto de Permisos No Disponible
**Probabilidad: BAJA**

El `PermisosProvider` puede no estar envolviendo correctamente el componente:
- Ya se agregó el provider en `components/providers.tsx`
- Pero puede haber un problema de timing

## Soluciones Propuestas

### Solución 1: Agregar Logs de Depuración (INMEDIATO)
Agregar logs para verificar:
1. Si el permiso está cargando
2. Qué nombre tiene el permiso en la BD
3. Qué valor retorna `tieneFuncionTecnica()`

**Implementación:**
```typescript
// En el campo precio
const precioHabilitado = tieneFuncionTecnica("modificar precio cotización") || esPRO001
console.log('🔍 [Precio] Debug:', {
  tienePermiso: tieneFuncionTecnica("modificar precio cotización"),
  esPRO001,
  precioHabilitado,
  loading,
  permisosTecnico: permisos["tecnico"]
})
```

### Solución 2: Mejorar Normalización de Acciones (RECOMENDADO)
Hacer que la normalización sea más robusta para manejar variaciones:

**Implementación:**
```typescript
// En use-permisos.ts
const tieneFuncionTecnica = (accion: string): boolean => {
  if (loading) return false;
  
  const accionNormalizada = accion
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase(); // Agregar normalización a minúsculas
  
  const permisosTecnico = permisos["tecnico"];
  if (!permisosTecnico) return false;
  
  // Buscar con normalización flexible
  const todasLasClaves = Object.keys(permisosTecnico);
  const claveEncontrada = todasLasClaves.find(k => {
    const kNormalizada = k.trim().replace(/\s+/g, " ").toLowerCase();
    return kNormalizada === accionNormalizada;
  });
  
  if (claveEncontrada) {
    return permisosTecnico[claveEncontrada] === true;
  }
  
  return false;
};
```

**Nota:** Esto requiere que el backend también normalice a minúsculas, o que se mantenga consistencia.

### Solución 3: Verificar Nombre Exacto del Permiso en BD (CRÍTICO)
Consultar la base de datos para verificar el nombre exacto:

**SQL Query:**
```sql
SELECT id, modulo, accion 
FROM permisos 
WHERE modulo = 'tecnico' 
AND accion ILIKE '%precio%cotizaci%';
```

**Si el nombre es diferente:**
- Opción A: Actualizar el código para usar el nombre correcto
- Opción B: Actualizar el permiso en BD para que coincida

### Solución 4: Manejar Estado de Carga (MEJORA)
Evitar que el campo quede bloqueado mientras cargan los permisos:

**Implementación:**
```typescript
// En el campo precio
const precioHabilitado = loading 
  ? true // Permitir edición mientras carga (optimista)
  : (tieneFuncionTecnica("modificar precio cotización") || esPRO001)
```

**Riesgo:** Puede permitir edición temporalmente a usuarios sin permiso.

### Solución 5: Forzar Re-render al Cargar Permisos (MEJORA)
Asegurar que el componente se actualice cuando los permisos terminen de cargar:

**Implementación:**
```typescript
// En use-permisos.ts
useEffect(() => {
  if (!loading && permisos["tecnico"]) {
    // Los permisos están listos, el componente se re-renderizará automáticamente
  }
}, [loading, permisos]);
```

## Plan de Acción Recomendado

### Paso 1: Diagnóstico (URGENTE)
1. Agregar logs de depuración en el campo precio
2. Verificar en la consola del navegador:
   - Valor de `loading`
   - Contenido de `permisos["tecnico"]`
   - Valor retornado por `tieneFuncionTecnica()`

### Paso 2: Verificar BD (CRÍTICO)
1. Ejecutar query SQL para ver el nombre exacto del permiso
2. Comparar con el nombre usado en el código
3. Si no coincide, actualizar código o BD según corresponda

### Paso 3: Implementar Solución
1. Si el nombre no coincide → Actualizar código/BD
2. Si hay problema de loading → Implementar Solución 4
3. Si hay problema de normalización → Implementar Solución 2

### Paso 4: Validación
1. Verificar que el campo precio se habilita con el permiso
2. Verificar que las validaciones permiten aprobar con precio menor
3. Verificar que PRO-001 sigue funcionando

## Notas Adicionales

- El código actual es correcto en estructura
- El problema es probablemente de coincidencia de nombres o timing
- PRO-001 funciona porque no depende de permisos
- Las validaciones están correctamente implementadas, solo falta que el permiso se detecte
