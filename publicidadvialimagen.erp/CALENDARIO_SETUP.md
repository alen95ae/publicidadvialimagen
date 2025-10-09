# Módulo de Calendario - Documentación

## 📋 Descripción General

Módulo completo de calendario integrado en el ERP que permite gestionar eventos, tareas y trabajos del día. Los usuarios pueden visualizar sus actividades en formato mensual, semanal o diario, similar a Google Calendar.

## 🗂️ Estructura de Archivos Creados

```
publicidadvialimagen.erp/
├── app/
│   ├── api/calendario/
│   │   ├── route.ts                     # API: GET (obtener eventos), POST (crear evento)
│   │   ├── [id]/route.ts                # API: PUT (actualizar), DELETE (eliminar)
│   │   └── empleados/route.ts           # API: GET empleados
│   └── panel/calendario/
│       ├── page.tsx                     # Página principal (Server Component)
│       └── CalendarClient.tsx           # Cliente del calendario (Client Component)
├── components/calendar/
│   ├── CalendarView.tsx                 # Vista principal del calendario
│   └── EventCard.tsx                    # Componente para mostrar eventos
├── lib/
│   ├── calendar-api.ts                  # API de Airtable (Server-side)
│   └── calendar-client.ts               # Cliente de API (Client-side)
└── styles/
    └── calendar.css                     # Estilos personalizados del calendario
```

## ⚙️ Configuración de Airtable

### Tabla: `Eventos`

Para que el módulo funcione correctamente, necesitas crear una tabla llamada **"Eventos"** en tu base de Airtable con los siguientes campos:

| Nombre del Campo | Tipo           | Descripción                                    |
|------------------|----------------|------------------------------------------------|
| `Titulo`         | Single line text | Título del evento (requerido)                 |
| `Descripcion`    | Long text      | Descripción detallada del evento               |
| `FechaInicio`    | Date           | Fecha y hora de inicio (incluye hora)          |
| `FechaFin`       | Date           | Fecha y hora de fin (incluye hora)             |
| `AsignadoA`      | Single line text | ID del empleado asignado                      |
| `NombreAsignado` | Single line text | Nombre del empleado (opcional)                |
| `Estado`         | Single select  | Estado del evento: pendiente, en_curso, completado |
| `UserId`         | Single line text | ID del usuario propietario del evento         |

### Tabla: `Empleados` (Opcional)

Si deseas usar el selector de empleados al crear eventos, crea una tabla llamada **"Empleados"**:

| Nombre del Campo | Tipo             | Descripción                      |
|------------------|------------------|----------------------------------|
| `Nombre`         | Single line text | Nombre completo del empleado     |
| `Email`          | Email            | Email del empleado (opcional)    |

### Configuración del Campo Estado

Para el campo `Estado` en la tabla `Eventos`, configura las siguientes opciones de Single Select:

- `pendiente` (color gris)
- `en_curso` (color azul)
- `completado` (color verde)

## 🎨 Características Implementadas

### ✅ Funcionalidades Core

1. **Vistas Múltiples**: Día, Semana y Mes
2. **Resumen del Día**: Muestra el número de tareas por estado
3. **Agregar Eventos**: Modal con formulario completo
4. **Editar Eventos**: Click en evento para editar o eliminar
5. **Filtrado por Usuario**: Solo muestra eventos del usuario autenticado
6. **Diseño Responsive**: Adaptado a dispositivos móviles
7. **Color Primario**: #D54644 (rojo corporativo)

### 📅 Vista Mensual

- Calendario completo del mes
- Día actual resaltado en fondo rojo claro
- Contador de eventos cuando hay múltiples en un día
- Click en cualquier día para crear evento

### 📆 Vista Semanal

- Vista de 7 días con horas
- Fin de semana con fondo gris claro
- Línea indicadora de hora actual
- Eventos mostrados con código de color según estado

### 📋 Vista Diaria

- Vista detallada de un solo día
- Eventos ordenados por hora de inicio
- Slots de tiempo de 30 minutos
- Fácil creación de eventos arrastrando

### 🎨 Estados Visuales

- **Pendiente**: Gris con ícono de círculo vacío
- **En Curso**: Azul con ícono de loader
- **Completado**: Verde con ícono de check

## 🚀 Uso del Módulo

### Navegación

El módulo está disponible en el menú lateral del ERP como **"Calendario"** con ícono de calendario.

### Crear un Evento

1. Haz click en el botón "Agregar Evento" o haz click en cualquier día/hora del calendario
2. Completa el formulario:
   - **Título** (requerido)
   - **Descripción** (opcional)
   - **Fecha y hora de inicio**
   - **Fecha y hora de fin**
   - **Asignado a** (selector de empleados)
   - **Estado** (pendiente/en_curso/completado)
3. Haz click en "Guardar"

### Editar o Eliminar un Evento

1. Haz click en cualquier evento del calendario
2. Modifica los campos que desees en el modal
3. Haz click en "Actualizar" o "Eliminar"

### Cambiar Vista

Usa los botones en la parte superior derecha para cambiar entre:
- **Día**: Vista detallada de un día
- **Semana**: Vista de 7 días
- **Mes**: Vista del mes completo

### Navegación Temporal

- **Hoy**: Vuelve al día actual
- **Flechas**: Navega hacia adelante o atrás
- La fecha actual se muestra junto al ícono de calendario

## 🎯 Extras Implementados

✅ Resumen con número de tareas del día en la parte superior
✅ Vista diaria con trabajos ordenados por hora
✅ Vista semanal con fin de semana destacado en gris claro
✅ Vista mensual con contador de eventos múltiples
✅ Día actual resaltado con fondo especial
✅ Estados visuales con íconos y colores diferenciados
✅ Modal completo para crear/editar eventos
✅ Integración con Airtable
✅ Autenticación con Kinde
✅ Diseño responsive
✅ Animaciones y transiciones suaves

## 🔧 Dependencias Instaladas

```bash
npm install react-big-calendar @types/react-big-calendar moment --legacy-peer-deps
```

## 📝 Notas Técnicas

- El módulo usa **react-big-calendar** con **moment.js** como localizador
- Todas las fechas están localizadas en español
- Los estilos están centralizados en `styles/calendar.css`
- **Arquitectura Cliente-Servidor**:
  - `calendar-api.ts` - Funciones server-side que acceden directamente a Airtable
  - `calendar-client.ts` - Funciones client-side que llaman a las rutas API
  - Rutas API en `/api/calendario/*` - Intermedian entre cliente y Airtable
- El componente principal (`CalendarView`) es cliente-side
- La página principal (`page.tsx`) es server-side para obtener datos iniciales
- La actualización de eventos es en tiempo real al guardar/editar/eliminar

## 🐛 Troubleshooting

### Error al instalar dependencias
Si tienes problemas con las dependencias, usa `--legacy-peer-deps`:
```bash
npm install react-big-calendar --legacy-peer-deps
```

### Eventos no aparecen
1. Verifica que la tabla "Eventos" existe en Airtable
2. Verifica que los campos coinciden con los nombres especificados
3. Revisa las credenciales de Airtable en `.env`

### Empleados no aparecen en el selector
1. Crea la tabla "Empleados" en Airtable
2. Agrega al menos un empleado de prueba
3. Recarga la página

## 🎨 Personalización

### Cambiar color primario
Edita el color en `styles/calendar.css`:
```css
:root {
  --calendar-primary: #D54644; /* Cambia este valor */
}
```

### Modificar altura del calendario
En `CalendarView.tsx`, busca la línea:
```tsx
<div className="..." style={{ height: 700 }}>
```

### Agregar más estados
1. Agrega el estado en Airtable
2. Actualiza el tipo en `lib/calendar-api.ts`
3. Agrega la configuración visual en `EventCard.tsx`

## ✅ Checklist de Implementación

- [x] Instalación de react-big-calendar
- [x] Creación de API para Airtable
- [x] Componente EventCard
- [x] Componente CalendarView con 3 vistas
- [x] Página principal con resumen
- [x] Estilos personalizados
- [x] Modal para crear/editar eventos
- [x] Integración con autenticación
- [x] Diseño responsive
- [x] Sin modificaciones a otros módulos

## 📞 Soporte

Para cualquier problema o mejora, revisa este documento y los comentarios en el código.

