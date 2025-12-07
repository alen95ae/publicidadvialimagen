# INFORME TÉCNICO EXHAUSTIVO: Problema "ver dueño de casa"

## A) ¿Por qué "ver dueño de casa" aparece SIEMPRE visible aunque el rol no lo tenga activado?

### Análisis del flujo completo:

**1. Base de Datos (Supabase):**
- Permiso existe: `id: 69, modulo: "tecnico", accion: "ver dueño de casa"`
- Rol "produccion" tiene: `permisosTecnicos: [69, 58, 61, 66]` (69 está incluido)
- Estado: ✅ CORRECTO

**2. Backend - API `/api/permisos/route.ts` (Líneas 125-149):**
```typescript
(permisosData || []).forEach(permiso => {
  const moduloNormalizado = normalizarModulo(permiso.modulo);
  const accionNormalizada = normalizarAccion(permiso.accion);
  const estaAsignado = permisoIds.includes(permiso.id);
  permisosMatrix[moduloNormalizado][accionNormalizada] = estaAsignado;
});
```
- **Estado:** Se establece correctamente según `permisoIds.includes(permiso.id)`
- **Valor esperado:** `true` si ID 69 está en `permisoIds`, `false` si no

**3. Backend - Lógica de Admin (Líneas 151-185):**
```typescript
if (tieneAdminEnAlgunModulo) {
  permisosTecnicos.forEach(permiso => {
    if (accionNormalizada === 'ver dueño de casa') {
      const estaEnRol = permisoIds.includes(permiso.id);
      permisosMatrix[moduloNormalizado][accionNormalizada] = estaEnRol;
    } else {
      permisosMatrix[moduloNormalizado][accionNormalizada] = true;
    }
  });
}
```
- **Estado:** Re-establece el valor según el rol
- **Problema potencial:** Si la normalización de `accionNormalizada` no coincide exactamente entre la línea 128 y 162, puede crear claves diferentes

**4. Frontend - Hook `use-permisos.ts` (Líneas 114-136):**
```typescript
const tieneFuncionTecnica = (accion: string): boolean => {
  const accionNormalizada = accion.trim().replace(/\s+/g, " ");
  const resultado = permisos["tecnico"]?.[accionNormalizada] === true;
  return resultado;
};
```
- **Estado:** Verifica directamente `permisos["tecnico"][accionNormalizada] === true`
- **Problema potencial:** Si la normalización no coincide exactamente con la del backend, la clave no se encuentra

## B) ¿Qué valor está llegando exactamente desde la API?

### Verificación necesaria en los logs del servidor:

**Log esperado en línea 138:**
```javascript
🔍 [Permisos API] Permiso "ver dueño de casa": {
  permisoId: 69,
  estaEnRol: true/false,  // ← VERIFICAR ESTE VALOR
  permisoIds: [...],
  accionOriginal: "ver dueño de casa",
  accionNormalizada: "ver dueño de casa",  // ← VERIFICAR QUE COINCIDA
  claveUsada: "tecnico.ver dueño de casa"
}
```

**Log esperado en línea 172 (si usuario tiene admin):**
```javascript
🔍 [Permisos API] Usuario con admin - "ver dueño de casa" establecido: {
  estaEnRol: true/false,  // ← VERIFICAR ESTE VALOR
  valorEstablecido: true/false  // ← VERIFICAR QUE SEA BOOLEAN
}
```

**Log esperado en línea 163:**
```javascript
🔍 [Permisos API] Permisos técnicos para usuario: {
  permisosTecnicos: {...},
  'ver dueño de casa': true/false/undefined,  // ← VERIFICAR ESTE VALOR
  'todasLasClaves': [...],  // ← VERIFICAR QUE "ver dueño de casa" ESTÉ EN LA LISTA
  'tipoVerDuenoCasa': "boolean" o "undefined"  // ← VERIFICAR EL TIPO
}
```

### Posibles problemas:

1. **Clave no coincide:** `accionNormalizada` en backend ≠ `accionNormalizada` en frontend
2. **Valor undefined:** La clave no existe en el objeto
3. **Valor siempre true:** La lógica de admin está forzando `true` incorrectamente
4. **Valor siempre false:** El permiso no se está asignando correctamente

## C) ¿Qué sucede en el hook usePermisos() al transformarlo?

### Flujo de datos:

**1. Carga inicial (Líneas 24-47):**
```typescript
const response = await fetch("/api/permisos");
const data = await response.json();
setPermisos(data.permisos || {});
```
- **Estado:** Recibe el objeto `permisosMatrix` del backend
- **Problema potencial:** Si `data.permisos` es `undefined` o `null`, se establece `{}` vacío

**2. Verificación (Líneas 114-136):**
```typescript
const accionNormalizada = accion.trim().replace(/\s+/g, " ");
const resultado = permisos["tecnico"]?.[accionNormalizada] === true;
```
- **Normalización:** Solo elimina espacios extra, mantiene acentos
- **Búsqueda:** Directa en `permisos["tecnico"][accionNormalizada]`
- **Problema potencial:** Si la clave no existe, retorna `undefined === true` = `false`

### Posibles problemas en el hook:

1. **Timing:** Se verifica antes de que `permisos` esté cargado (`loading: true`)
2. **Normalización diferente:** Backend y frontend normalizan de forma distinta
3. **Clave no encontrada:** La clave existe pero con variaciones (espacios, encoding)

## D) ¿Qué sucede en costes/page.tsx?

### Código actual (Línea 116):
```typescript
const puedeVerDuenoCasa = tieneFuncionTecnica("ver dueño de casa")
```

### Análisis:

1. **Se ejecuta en cada render:** Se llama cada vez que el componente se re-renderiza
2. **Depende de `tieneFuncionTecnica`:** Que depende de `permisos` del contexto
3. **No hay memoización:** Se recalcula en cada render
4. **No verifica `loading`:** No espera a que los permisos estén cargados

### Problema potencial:

Si `permisosLoading` es `true` cuando se ejecuta `tieneFuncionTecnica("ver dueño de casa")`, entonces:
- `permisos` puede ser `{}` (vacío)
- `permisos["tecnico"]` es `undefined`
- `permisos["tecnico"]?.[accionNormalizada]` es `undefined`
- `undefined === true` es `false`
- Pero si hay un fallback o lógica que devuelve `true` por defecto, siempre se mostraría

## E) ¿Dónde se produce el desajuste?

### Puntos de verificación:

**1. Base de Datos → Backend (Línea 133):**
- ✅ `permisoIds.includes(permiso.id)` debería ser `true` si el rol tiene el permiso
- ❓ **Verificar:** ¿El ID 69 está realmente en `permisoIds`?

**2. Backend - Primera asignación (Línea 134):**
- ✅ `permisosMatrix['tecnico']['ver dueño de casa'] = estaAsignado`
- ❓ **Verificar:** ¿El valor se establece correctamente?

**3. Backend - Lógica de admin (Línea 171):**
- ✅ `permisosMatrix[moduloNormalizado][accionNormalizada] = estaEnRol`
- ❓ **Verificar:** ¿Se sobrescribe correctamente o se pierde?

**4. Backend → Frontend (Línea 171 de route.ts):**
- ✅ `return NextResponse.json({ permisos: permisosMatrix })`
- ❓ **Verificar:** ¿El objeto se serializa correctamente?

**5. Frontend - Hook carga (Línea 39):**
- ✅ `setPermisos(data.permisos || {})`
- ❓ **Verificar:** ¿El objeto llega completo?

**6. Frontend - Verificación (Línea 121):**
- ✅ `permisos["tecnico"]?.[accionNormalizada] === true`
- ❓ **Verificar:** ¿La clave existe y tiene el valor correcto?

## F) Diagnóstico final

### ❗ DIAGNÓSTICO MÁS PROBABLE:

**El permiso se establece correctamente en el backend, pero la normalización de la clave no coincide exactamente entre backend y frontend, causando que la clave no se encuentre en el frontend, resultando en `undefined === true` = `false`, pero si hay algún fallback o la lógica de admin está forzando `true` para otros permisos técnicos, puede estar afectando indirectamente.**

### Verificaciones necesarias:

1. **En logs del servidor:**
   - Verificar que `accionNormalizada` en línea 145 sea exactamente `"ver dueño de casa"` (sin espacios extra)
   - Verificar que `valorEstablecido` en línea 177 sea un `boolean` (`true` o `false`)
   - Verificar que `'ver dueño de casa'` aparezca en `todasLasClaves` del log final

2. **En logs del navegador:**
   - Verificar que `todasLasClaves` incluya `"ver dueño de casa"`
   - Verificar que `valorEnPermisos` sea `true`, `false` o `undefined`
   - Verificar que `accionNormalizada` coincida exactamente con las claves del objeto

3. **Verificación manual:**
   - En la consola del navegador, ejecutar:
   ```javascript
   // Obtener permisos del contexto
   const permisos = ...; // desde el contexto
   console.log('Permisos técnicos:', permisos['tecnico']);
   console.log('Claves:', Object.keys(permisos['tecnico'] || {}));
   console.log('Valor ver dueño de casa:', permisos['tecnico']?.['ver dueño de casa']);
   console.log('Tipo:', typeof permisos['tecnico']?.['ver dueño de casa']);
   ```

## SOLUCIÓN QUIRÚRGICA PROPUESTA

Sin tocar la lógica de admin, la solución es asegurar que:

1. **La normalización sea idéntica en backend y frontend**
2. **El valor siempre sea un boolean explícito (nunca undefined)**
3. **Se verifique el estado de loading antes de usar el permiso**

### Cambios específicos:

**1. En el backend, asegurar que el valor siempre sea boolean:**
```typescript
// Después de establecer permisosMatrix['tecnico'][accionNormalizada]
// Asegurar que SIEMPRE sea boolean, nunca undefined
if (permisosMatrix['tecnico']['ver dueño de casa'] === undefined) {
  permisosMatrix['tecnico']['ver dueño de casa'] = false;
}
```

**2. En el frontend, verificar loading:**
```typescript
const puedeVerDuenoCasa = !permisosLoading && tieneFuncionTecnica("ver dueño de casa")
```

**3. Agregar validación explícita:**
```typescript
const tieneFuncionTecnica = (accion: string): boolean => {
  if (loading) return false; // No verificar si aún está cargando
  const accionNormalizada = accion.trim().replace(/\s+/g, " ");
  const valor = permisos["tecnico"]?.[accionNormalizada];
  return valor === true; // Explícitamente true, no truthy
};
```

