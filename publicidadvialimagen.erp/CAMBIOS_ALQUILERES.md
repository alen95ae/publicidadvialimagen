# Cambios en el Sistema de Alquileres

## Resumen

Se implementó la lógica para actualizar automáticamente los estados de los soportes cuando se modifican o rechazan cotizaciones aprobadas.

## Funcionalidades Implementadas

### 1. Rechazo de Cotizaciones Aprobadas

**Comportamiento:**
- Cuando una cotización en estado "Aprobada" cambia a "Rechazada"
- Se eliminan todos los alquileres asociados a esa cotización
- Los soportes afectados se actualizan a "Disponible" (si no tienen otros alquileres activos)

**Archivos modificados:**
- `app/api/cotizaciones/[id]/route.ts` (PATCH): Detecta el cambio de estado y cancela alquileres

### 2. Modificación y Re-aprobación de Cotizaciones

**Comportamiento:**
- Cuando se modifica una cotización aprobada y se vuelve a aprobar:
  - Se cancelan los alquileres antiguos de esa cotización
  - Los soportes eliminados pasan a "Disponible" (si no tienen otros alquileres)
  - Se crean nuevos alquileres para los soportes actuales
  - Los soportes nuevos pasan a "Ocupado"

**Archivos modificados:**
- `app/api/cotizaciones/[id]/crear-alquileres/route.ts` (POST): Cancela alquileres existentes antes de crear los nuevos

### 3. Funciones de Biblioteca Nuevas

**En `lib/supabaseAlquileres.ts`:**
- `getAlquileresPorCotizacion(cotizacionId)`: Obtiene todos los alquileres de una cotización
- `cancelarAlquileresDeCotizacion(cotizacionId)`: Elimina todos los alquileres de una cotización y devuelve los soportes afectados

**En `lib/helpersAlquileres.ts`:**
- `actualizarEstadoSoporte(soporteId)`: Actualiza el estado de un soporte basado en sus alquileres vigentes
- `cancelarAlquileresCotizacion(cotizacionId)`: Cancela alquileres y actualiza estados de soportes afectados

## Flujos de Trabajo

### Flujo 1: Rechazar Cotización Aprobada

```
1. Usuario marca cotización como "Rechazada"
2. API PATCH detecta cambio de "Aprobada" → "Rechazada"
3. Se cancelan todos los alquileres de la cotización
4. Para cada soporte afectado:
   - Se verifica si tiene otros alquileres activos
   - Si no tiene, se marca como "Disponible"
   - Si tiene, se mantiene como "Ocupado"
5. Se actualiza la cotización a "Rechazada"
```

### Flujo 2: Modificar y Re-aprobar Cotización

```
1. Usuario edita cotización aprobada (elimina soporte A, añade soporte B)
2. Usuario marca como "Aprobada" nuevamente
3. API POST /crear-alquileres detecta alquileres existentes
4. Se cancelan alquileres antiguos (incluyendo soporte A)
5. Soporte A se actualiza a "Disponible" (si no tiene otros alquileres)
6. Se crean nuevos alquileres (incluyendo soporte B)
7. Soporte B se actualiza a "Ocupado"
```

## Lógica de Estados de Soportes

Un soporte está:
- **"Ocupado"**: Si tiene al menos un alquiler con estado 'activo', 'reservado' o 'proximo'
- **"Disponible"**: Si NO tiene ningún alquiler vigente (o todos están 'finalizado')

## Consideraciones Importantes

### Problema de Esquema UUID vs Numérico

**Error actual:** `invalid input syntax for type uuid: "27"`

**Causa:** 
- `soportes.id` es numérico (integer)
- `alquileres.soporte_id` es UUID

**Solución requerida:**
Ajustar el esquema en Supabase:

```sql
ALTER TABLE alquileres 
ALTER COLUMN soporte_id TYPE integer USING soporte_id::text::integer;
```

O si prefieres mantener UUID, necesitarás:
1. Añadir un campo `uuid` a la tabla `soportes`
2. Actualizar el código para usar ese UUID

El código actual está preparado para usar IDs numéricos directamente. Una vez ajustado el esquema, funcionará correctamente.

## Testing

Para probar la funcionalidad:

1. **Crear y aprobar cotización con soportes:**
   - Crear cotización con 2 soportes
   - Aprobar → Soportes pasan a "Ocupado"
   - Verificar en `/panel/soportes/alquileres` que se crearon

2. **Rechazar cotización aprobada:**
   - Cambiar estado a "Rechazada"
   - Verificar que soportes vuelven a "Disponible"
   - Verificar que alquileres desaparecen del listado

3. **Modificar y re-aprobar:**
   - Editar cotización aprobada
   - Eliminar 1 soporte, añadir 1 nuevo
   - Aprobar
   - Verificar que:
     - Soporte eliminado → "Disponible"
     - Soporte nuevo → "Ocupado"
     - Se crearon nuevos alquileres

## Logs

El sistema registra:
- `🗑️` Cancelación de alquileres
- `🔄` Actualización de estados de soportes
- `✅` Operaciones exitosas
- `❌` Errores

Revisar la consola del servidor para ver el flujo completo.

