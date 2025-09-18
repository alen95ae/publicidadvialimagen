# Publicidad Vial Imagen Panel

Panel de control para gestión de soportes publicitarios desarrollado con Next.js, TypeScript y Tailwind CSS.

## 🚀 Características

- **Backend completo** con Prisma ORM y SQLite
- **Autenticación** con NextAuth.js
- **Módulo de Soportes** completamente funcional (CRUD)
- **UI moderna** con shadcn/ui y Tailwind CSS
- **Base preparada** para expandir a otros módulos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Prisma ORM + SQLite
- **Autenticación**: NextAuth.js
- **Validación**: Zod + React Hook Form

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o pnpm

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repo>
   cd publicidadvialimagen-panel
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # El archivo .env ya está creado con valores de desarrollo
   # Para producción, modificar según sea necesario
   ```

4. **Configurar base de datos**
   ```bash
   # Crear y migrar la base de datos
   npx prisma migrate dev --name init
   
   # Ejecutar seed con datos de prueba
   npx prisma db seed
   ```

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 🔐 Acceso

- **URL**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Panel**: http://localhost:3000/panel

### Credenciales de Prueba
- **Email**: admin@publicidadvialimagen.com
- **Contraseña**: admin123

## 📊 Módulos Disponibles

### ✅ Soportes (Completamente Funcional)
- Listado con búsqueda y filtros
- Crear nuevos soportes
- Editar soportes existentes
- Eliminar soportes
- Gestión de ubicaciones y precios

### ✅ Contactos (Completamente Funcional)
- **Lista**: `/panel/contactos` - Vista general con búsqueda, filtros, agrupación y favoritos
- **Crear**: `/panel/contactos/nuevo` - Formulario completo para crear contactos
- **Detalle/Editar**: `/panel/contactos/[id]` - Vista detallada con modo de edición
- **Funcionalidades**: 
  - CRUD completo para contactos individuales y empresas
  - Búsqueda avanzada por nombre, NIT, email, ciudad, país
  - Filtros por relación (Cliente/Proveedor/Ambos), comercial, ciudad, país
  - Agrupación por comercial, ciudad o país
  - Sistema de favoritos
  - Exportación a CSV
  - Acciones masivas (eliminación, cambio de relación)
  - Asignación de comerciales
  - Etiquetas personalizables
- **Alias**: `/panel/clientes` → redirige a `/panel/contactos`

### 🚧 En Construcción
- **Empresas**: Administración de empresas asociadas
- **Reservas**: Sistema de reservas y calendario
- **Calendario**: Vista de ocupación de soportes
- **Métricas**: Estadísticas y reportes
- **Facturación**: Gestión de facturas y pagos
- **CRM**: Gestión de relaciones con clientes
- **Mensajería**: Sistema de comunicación interna
- **Moderación**: Control de contenido y usuarios
- **Mapas**: Visualización geográfica de soportes
- **Diseño**: Herramientas de diseño gráfico
- **Ajustes**: Configuración del sistema

## 🗄️ Estructura de Base de Datos

### Modelos Principales
- **User**: Usuarios del sistema con roles (ADMIN, MANAGER, OPERATOR)
- **Company**: Empresas asociadas
- **Support**: Soportes publicitarios
- **Reservation**: Reservas de soportes
- **Contact**: Contactos comerciales (individuales y empresas)
- **ContactTag**: Etiquetas personalizables para contactos
- **ContactTagOnContact**: Relación muchos a muchos entre contactos y etiquetas

### Relaciones
- Empresas pueden tener múltiples soportes
- Soportes pueden tener múltiples reservas
- Usuarios pueden ser asignados como comerciales de contactos
- Contactos pueden tener múltiples etiquetas

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start

# Base de datos
npx prisma studio          # Abrir interfaz visual de la BD
npx prisma migrate dev     # Crear nueva migración
npx prisma db seed         # Ejecutar seed
npx prisma generate        # Regenerar cliente Prisma
```

## 🌐 API Endpoints

### Soportes
- `GET /api/soportes` - Listar soportes (con búsqueda opcional)
- `POST /api/soportes` - Crear nuevo soporte
- `GET /api/soportes/[id]` - Obtener soporte específico
- `PUT /api/soportes/[id]` - Actualizar soporte
- `DELETE /api/soportes/[id]` - Eliminar soporte

### Contactos
- `GET /api/contactos` - Listar contactos (con búsqueda, filtros y paginación)
- `POST /api/contactos` - Crear nuevo contacto
- `GET /api/contactos/[id]` - Obtener contacto específico
- `PUT /api/contactos/[id]` - Actualizar contacto
- `PATCH /api/contactos/[id]` - Actualización parcial (favoritos, etc.)
- `DELETE /api/contactos/[id]` - Eliminar contacto (soft delete)
- `GET /api/contactos/export` - Exportar contactos a CSV
- `GET /api/users` - Listar usuarios del sistema

### Autenticación
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

## 🎨 Personalización

### Colores del Tema
El proyecto usa la paleta de colores de Publicidad Vial Imagen:
- **Primario**: #D54644 (rojo Publicidad Vial Imagen)
- **Hover**: #B03A38 (rojo más oscuro)
- **Fondo**: gray-50
- **Texto**: slate-800

### Componentes UI
Todos los componentes están basados en shadcn/ui y son completamente personalizables desde `components/ui/`.

## 🚀 Despliegue

### Desarrollo Local
- SQLite para desarrollo rápido
- Variables de entorno preconfiguradas

### Producción
- Preparado para migrar a PostgreSQL (Supabase recomendado)
- Variables de entorno para producción
- Middleware de autenticación activo

## 📝 Notas de Desarrollo

- **TypeScript**: Configurado con strict mode
- **ESLint**: Configuración estándar de Next.js
- **Tailwind**: Configuración v4 con animaciones
- **Responsive**: Diseño mobile-first

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y propiedad de Publicidad Vial Imagen.

## 📞 Soporte

Para soporte técnico o preguntas, contactar al equipo de desarrollo.

---

**Publicidad Vial Imagen Panel** - Sistema de gestión de soportes publicitarios
