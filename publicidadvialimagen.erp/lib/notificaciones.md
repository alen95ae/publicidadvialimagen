# Sistema de Notificaciones - Documentación

## Arquitectura

El sistema de notificaciones utiliza **únicamente** la tabla `notificaciones` en Supabase.

### Estructura de la Tabla

```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('info', 'success', 'warning', 'error')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id UUID,
  prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
  roles_destino TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  leida BOOLEAN DEFAULT false, -- Legacy, mantenida por compatibilidad
  user_id UUID, -- Legacy, mantenida por compatibilidad
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notificaciones_leidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  leida BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(notificacion_id, user_id)
);
```

**Nota:** Las columnas `user_id` y `leida` en `notificaciones` son legacy y se mantienen por compatibilidad temporal. El sistema actual usa `roles_destino` para visibilidad y `notificaciones_leidas` para tracking de lectura.

## API Endpoints

### GET /api/notificaciones
- **Autenticación**: Obligatoria (cookie session)
- **Respuesta**: Array de notificaciones del usuario autenticado
- **Formato**:
  ```json
  [
    {
      "id": "uuid",
      "tipo": "info|success|warning|error",
      "titulo": "string",
      "mensaje": "string",
      "prioridad": "baja|media|alta",
      "leida": boolean,
      "entidad_tipo": "string|null",
      "entidad_id": "uuid|null",
      "created_at": "ISO8601"
    }
  ]
  ```

### GET /api/notificaciones/count
- **Autenticación**: Obligatoria
- **Respuesta**: `{ "count": number }` - Notificaciones no leídas

### PATCH /api/notificaciones/[id]
- **Autenticación**: Obligatoria
- **Acción**: Marca notificación como leída (`leida: true`)
- **Validación**: Verifica que `user_id` coincida

### DELETE /api/notificaciones/[id]
- **Autenticación**: Obligatoria
- **Acción**: Elimina la notificación
- **Validación**: Verifica que `user_id` coincida

## Helpers de Creación

### `crearNotificacion(data: NotificacionData)`
Función principal para crear una notificación. Requiere `roles_destino` como array de roles.

**Ejemplo:**
```typescript
await crearNotificacion({
  titulo: 'Nuevo evento',
  mensaje: 'Se ha creado un nuevo evento',
  tipo: 'info',
  entidad_tipo: 'evento',
  entidad_id: eventoId,
  prioridad: 'media',
  roles_destino: ['admin', 'ventas']
});
```

### `crearNotificacionUsuario(userId: string, data)`
Crea una notificación para un usuario específico. Obtiene automáticamente el rol del usuario y crea la notificación dirigida a ese rol.

**Ejemplo:**
```typescript
await crearNotificacionUsuario(userId, {
  titulo: 'Tarea asignada',
  mensaje: 'Se te ha asignado una nueva tarea',
  tipo: 'info',
  entidad_tipo: 'tarea',
  entidad_id: tareaId,
  prioridad: 'media'
});
```

### `crearNotificacionPorRol(rolNombre: string, data: NotificacionData)`
Crea una notificación para todos los usuarios de un rol específico. Normaliza el nombre del rol a minúsculas.

**Ejemplo:**
```typescript
await crearNotificacionPorRol('admin', {
  titulo: 'Alerta del sistema',
  mensaje: 'Se requiere atención inmediata',
  tipo: 'error',
  entidad_tipo: 'sistema',
  entidad_id: alertaId,
  prioridad: 'alta',
  roles_destino: ['admin'] // Se sobrescribe con el rol especificado
});
```

### Helpers Específicos

- `notificarFormularioNuevo(formularioId, nombre, email)`
- `notificarCotizacion(cotizacionId, accion, userId?)`
- `notificarAlquilerProximoFinalizar(alquilerId, diasRestantes, userId?)`
- `notificarStockBajo(productoId, productoNombre, stockActual)`
- `notificarEventoProximo(eventoId, eventoNombre, fecha, userId?)`
- `notificarMantenimientoPendiente(mantenimientoId, descripcion)`
- `notificarFactura(facturaId, tipo, dias)`

## Mapeo de Roles

### Administrador
- Todas las notificaciones del sistema
- Formularios, cotizaciones, alquileres, stock, facturas

### Ventas
- Formularios nuevos
- Cotizaciones creadas/actualizadas
- Alquileres próximos a finalizar
- Agenda comercial

### Producción
- Alquileres
- Planificación
- Stock bajo
- Incidencias técnicas

### Contabilidad
- Facturas emitidas/vencidas
- Pagos recibidos
- Cierres mensuales

### Operario
- Tareas asignadas
- Incidencias asignadas

### Desarrollador
- Todas las de administrador
- Incidencias técnicas del sistema

## Construcción de URLs

Las URLs se construyen en el frontend basándose en `entidad_tipo`:

- `formulario` → `/panel/mensajes/formularios`
- `cotizacion` → `/panel/ventas/cotizaciones`
- `alquiler` → `/panel/soportes/alquileres`
- `mantenimiento` → `/panel/soportes/mantenimiento`
- `solicitud` → `/panel/ventas/solicitudes`
- `soporte` → `/panel/soportes/gestion`
- `producto` → `/panel/inventario`
- `factura` → `/panel/contabilidad`
- `evento` → `/panel/calendario`

## Eventos que Generan Notificaciones

1. **Formulario nuevo** → `notificarFormularioNuevo()` (POST /api/messages)
2. **Cotización creada** → `notificarCotizacion()` (POST /api/cotizaciones)
3. **Cotización actualizada** → `notificarCotizacion()` (PATCH /api/cotizaciones/[id])
4. **Alquiler próximo a finalizar** → `notificarAlquilerProximoFinalizar()` (tarea programada)
5. **Stock bajo** → `notificarStockBajo()` (validación de inventario)
6. **Factura vencida/próxima** → `notificarFactura()` (tarea programada)
7. **Mantenimiento pendiente** → `notificarMantenimientoPendiente()` (creación de mantenimiento)

## Prioridades

- **alta**: Facturas vencidas, stock crítico, alquileres que finalizan en ≤3 días
- **media**: Formularios nuevos, cotizaciones, eventos próximos
- **baja**: Recordatorios, información general
