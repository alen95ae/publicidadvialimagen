# Sistema de Notificaciones - Documentación

## Arquitectura

El sistema de notificaciones utiliza **únicamente** la tabla `notificaciones` en Supabase.

### Estructura de la Tabla

```sql
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  entidad_tipo TEXT,
  entidad_id UUID,
  prioridad TEXT DEFAULT 'media',
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

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

### `crearNotificacionUsuario(userId, data)`
Crea una notificación para un usuario específico.

### `crearNotificacionPorRol(rolNombre, data)`
Crea notificaciones para todos los usuarios de un rol.

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
