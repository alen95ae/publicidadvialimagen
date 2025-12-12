# Sistema de Permisos - Documentación Técnica

## Estado: ESTABILIZADO ✅

Este documento explica las decisiones técnicas tomadas para estabilizar el sistema de permisos del ERP.

---

## Arquitectura

### Flujo de Permisos

```
Usuario autenticado (JWT)
    ↓
API /api/permisos (con getSupabaseAdmin)
    ↓
Consulta: usuarios → roles → rol_permisos → permisos
    ↓
Construye permisosMatrix (normalizado)
    ↓
Aplica fallback si rol_permisos vacío
    ↓
Devuelve JSON canónico
    ↓
Hook usePermisos (frontend)
    ↓
Provider → Sidebar/Grid
```

---

## Decisiones Críticas

### 1. Uso de `getSupabaseAdmin()` en API de Permisos

**Ubicación:** `app/api/permisos/route.ts`

**Por qué:**
- Lee METADATOS del sistema (roles, permisos, rol_permisos)
- NO lee datos de negocio del usuario
- Evita bloqueos por RLS mal configurado en tablas de sistema
- El userId está verificado con JWT antes de consultar

**Restricción:**
- NUNCA usar Admin para leer datos de negocio (soportes, ventas, contactos, etc.)
- Solo para tablas de configuración del sistema

---

### 2. Sistema de Permisos por Defecto (Fallback)

**Ubicación:** `lib/permisos-utils.ts` → `PERMISOS_POR_DEFECTO_POR_ROL`

**Prioridad:**
1. **rol_permisos (BD)** → Siempre se respeta si existe
2. **Permisos por defecto** → Solo si rol_permisos está vacío

**Roles soportados:**
- `admin`: Acceso completo a todos los módulos
- `ventas`: mensajes, calendario, contactos, ventas, soportes
- `tecnico`: mensajes, calendario, soportes, mantenimiento
- `produccion`: mensajes, calendario, produccion, inventario
- `empleado`: mensajes, calendario (mínimo)

**Por qué:**
- Garantiza que usuarios con roles válidos SIEMPRE tengan acceso
- Previene el escenario de "menú vacío" si rol_permisos está vacío
- Es un fallback de seguridad, NO la fuente principal de permisos

---

### 3. Normalización Centralizada

**Ubicación:** `lib/permisos-utils.ts`

**Funciones:**
- `normalizarModulo()`: "Sitio Web" → "sitio"
- `normalizarAccion()`: Trim y colapso de espacios
- `MODULOS_SIDEBAR`: Lista canónica de módulos

**Por qué:**
- **UNA única fuente de verdad** para normalización
- API y frontend usan las MISMAS funciones
- Elimina desajustes entre backend y frontend

**Usado en:**
- `app/api/permisos/route.ts`
- `hooks/use-permisos.ts`

---

### 4. Protección Contra Regresiones

**Ubicación:** `app/api/permisos/route.ts` (final del GET)

```typescript
// 🛡️ PROTECCIÓN FINAL: Garantizar que siempre hay al menos módulo técnico
if (Object.keys(permisosMatrix).length === 0) {
  permisosMatrix['tecnico'] = {};
}
```

**Por qué:**
- Previene completamente el escenario de menú vacío
- Incluso si todo falla, el usuario ve al menos "Panel Principal"
- Es la última red de seguridad del sistema

---

### 5. Usuario Desarrollador (Bypass Total)

**Email hardcodeado:** `alen95ae@gmail.com`

**Comportamiento:**
- Ve TODOS los módulos del sidebar
- Tiene todos los permisos (ver, editar, eliminar, admin)
- NO depende de base de datos

**Por qué:**
- Garantiza acceso administrativo incluso si la BD falla
- Útil para debugging y configuración inicial

---

## Archivos Modificados

### Nuevos
- ✅ `lib/permisos-utils.ts` - Módulo compartido de utilidades

### Refactorizados
- ✅ `app/api/permisos/route.ts` - API consolidada, logs eliminados
- ✅ `hooks/use-permisos.ts` - Usa módulo compartido
- ✅ `components/sidebar.tsx` - Lógica simplificada (sin casos especiales)
- ✅ `components/erp-modules-grid.tsx` - Lógica simplificada

---

## Riesgos Eliminados

### ❌ Antes
- Normalización duplicada en 3 lugares diferentes
- Logs de debug dispersos
- Sin fallback para rol_permisos vacío
- getSupabaseUser() podía bloquearse por RLS

### ✅ Ahora
- Normalización centralizada en 1 lugar
- Sin logs de debug
- Fallback controlado por rol
- getSupabaseAdmin() documentado y justificado

---

## Garantías del Sistema

1. **Desarrollador:** Siempre ve todo (bypass total)
2. **Roles con permisos en BD:** Ven exactamente lo asignado
3. **Roles sin permisos en BD:** Ven permisos por defecto del rol
4. **Rol desconocido:** Ve permisos de empleado (mínimo)
5. **Caso extremo:** Siempre existe al menos módulo técnico

---

## Mantenimiento Futuro

### Agregar un nuevo módulo

1. Agregar clave canónica a `MODULOS_SIDEBAR` en `lib/permisos-utils.ts`
2. Agregar al sidebar en `components/sidebar.tsx`
3. Agregar al grid en `components/erp-modules-grid.tsx`
4. Crear registros en tabla `permisos` de BD
5. (Opcional) Agregar a `PERMISOS_POR_DEFECTO_POR_ROL` si debe ser visible por defecto

### Agregar un nuevo rol

1. Crear rol en tabla `roles` de BD
2. Agregar a `PERMISOS_POR_DEFECTO_POR_ROL` en `lib/permisos-utils.ts`
3. Asignar permisos en tabla `rol_permisos` (opcional, si no usa fallback)

---

## Testing Manual

### Verificar que funciona:

1. **Usuario desarrollador:**
   - Login → Debe ver TODOS los módulos
   
2. **Usuario con rol "ventas":**
   - Login → Debe ver: mensajes, calendario, contactos, ventas, soportes
   
3. **Usuario con rol "técnico":**
   - Login → Debe ver: mensajes, calendario, soportes, mantenimiento

4. **Usuario sin permisos asignados:**
   - Login → Debe ver al menos Panel Principal (no menú vacío)

---

## Confirmación Final

**"El sistema de permisos queda estable y no debería volver a romperse por cambios menores"**

✅ Normalización centralizada
✅ Fallback de seguridad
✅ Protecciones contra regresiones
✅ getSupabaseAdmin() documentado y justificado
✅ Sin logs de debug
✅ Comportamiento idéntico al funcional anterior
