# Módulo de Ajustes - ERP Publicidad Vial Imagen

## 📋 Descripción General

El módulo de Ajustes es un sistema completo de administración de usuarios, roles, permisos y accesos controlados por invitación para el ERP. Solo los usuarios con rol "admin" pueden acceder a este módulo.

## 🚀 Características Implementadas

### 1. Gestión de Usuarios (`/panel/ajustes`)
- **Listado completo** de usuarios del sistema
- **Búsqueda y filtrado** por nombre, email, rol y estado
- **Crear nuevos usuarios** con asignación de roles
- **Editar información** de usuarios existentes
- **Suspender/Reactivar** usuarios
- **Eliminar usuarios** del sistema
- **Paginación** para manejar grandes cantidades de usuarios

### 2. Sistema de Roles y Permisos
- **Roles predefinidos**:
  - **Administrador**: Acceso total a todos los módulos
  - **Gestor**: Acceso a Soportes, Contactos, Mensajes, Ventas y Producción
  - **Visualizador**: Solo lectura, sin poder editar o eliminar
- **Roles personalizados**: Crear roles con permisos específicos
- **Permisos granulares** por módulo:
  - Ver (view)
  - Editar (edit) 
  - Eliminar (delete)
- **Módulos disponibles**: Soportes, Contactos, Mensajes, Inventario, Calendario, Producción, Ventas, Contabilidad, Reservas, Clientes, Empleados, Diseño, Sitio Web, Ajustes

### 3. Sistema de Invitaciones
- **Generar enlaces únicos** con validez temporal (24-168 horas)
- **Tokens JWT seguros** con expiración automática
- **Asignación de roles** específicos por invitación
- **Seguimiento de estado**: Pendiente, Usado, Expirado
- **Revocación manual** de invitaciones pendientes
- **Validación automática** en el registro

### 4. Seguridad y Accesos
- **Middleware de seguridad** que limita el acceso solo a administradores
- **Validación de tokens** JWT en todas las operaciones
- **Verificación de permisos** antes de mostrar opciones
- **Protección de rutas** API con autenticación

## 🛠️ Estructura Técnica

### Endpoints API
```
/api/ajustes/usuarios
├── GET    - Listar usuarios (con filtros y paginación)
├── POST   - Crear usuario
├── PUT    - Actualizar usuario
└── DELETE - Eliminar usuario

/api/ajustes/roles
├── GET    - Listar roles y permisos
├── POST   - Crear rol personalizado
├── PUT    - Actualizar rol
└── DELETE - Eliminar rol personalizado

/api/ajustes/invitaciones
├── GET    - Listar invitaciones
├── POST   - Crear invitación
└── PUT    - Actualizar estado de invitación

/api/ajustes/validar-token
├── GET    - Validar token de invitación
└── POST   - Marcar token como usado
```

### Tablas de Airtable
- **Users**: Usuarios del sistema
- **Roles**: Roles y permisos (opcional, usa roles predefinidos si no existe)
- **Invitaciones**: Tokens de invitación y su estado

### Componentes React
- `UsersSection.tsx` - Gestión de usuarios
- `RolesSection.tsx` - Gestión de roles y permisos
- `InvitationsSection.tsx` - Sistema de invitaciones

## 🔧 Configuración Requerida

### Variables de Entorno
```env
AIRTABLE_BASE_ID=tu_base_id
AIRTABLE_API_KEY=tu_api_key
AIRTABLE_TABLE_USERS=Users
AIRTABLE_TABLE_ROLES=Roles
AIRTABLE_TABLE_INVITATIONS=Invitaciones
JWT_SECRET=tu_jwt_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Estructura de Tablas en Airtable

#### Tabla Users
- `Email` (Single line text)
- `Nombre` (Single line text)
- `Rol` (Single select: admin, gestor, visualizador, usuario)
- `Activo` (Checkbox)
- `UltimoAcceso` (Date)
- `FechaCreacion` (Date)

#### Tabla Roles (Opcional)
- `Nombre` (Single line text)
- `Descripcion` (Long text)
- `Permisos` (Long text - JSON)
- `EsPredefinido` (Checkbox)

#### Tabla Invitaciones
- `Email` (Single line text)
- `Rol` (Single line text)
- `Token` (Single line text)
- `Estado` (Single select: pendiente, usado, expirado)
- `FechaCreacion` (Date)
- `FechaExpiracion` (Date)
- `FechaUso` (Date)
- `Enlace` (URL)
- `HorasValidez` (Number)

## 🎯 Flujo de Uso

### 1. Acceso al Módulo
- Solo usuarios con rol "admin" pueden acceder a `/panel/ajustes`
- El middleware redirige automáticamente a usuarios sin permisos

### 2. Gestión de Usuarios
1. **Ver usuarios**: Lista completa con filtros
2. **Crear usuario**: Formulario con nombre, email y rol
3. **Editar usuario**: Modificar información y rol
4. **Suspender/Reactivar**: Cambiar estado del usuario
5. **Eliminar**: Remover usuario del sistema

### 3. Gestión de Roles
1. **Ver roles**: Lista de roles predefinidos y personalizados
2. **Crear rol**: Definir nombre, descripción y permisos
3. **Editar rol**: Modificar permisos existentes
4. **Eliminar rol**: Solo roles personalizados (no predefinidos)

### 4. Sistema de Invitaciones
1. **Crear invitación**: Email, rol y validez
2. **Generar enlace**: Token único con expiración
3. **Compartir enlace**: El usuario recibe el enlace por email
4. **Registro con invitación**: Validación automática del token
5. **Seguimiento**: Estado de cada invitación

## 🔒 Seguridad

### Validaciones Implementadas
- **Autenticación JWT** en todas las operaciones
- **Verificación de roles** antes de permitir acceso
- **Validación de tokens** de invitación con expiración
- **Sanitización de datos** en formularios
- **Protección CSRF** mediante tokens seguros

### Permisos por Módulo
Cada rol tiene permisos específicos definidos como:
```javascript
{
  soportes: { view: true, edit: true, delete: false },
  contactos: { view: true, edit: false, delete: false },
  // ... más módulos
}
```

## 🚀 Próximas Mejoras

- [ ] **Auditoría**: Log de cambios en usuarios y roles
- [ ] **Notificaciones**: Email automático al crear invitaciones
- [ ] **Plantillas**: Plantillas de email personalizables
- [ ] **Importación**: Importar usuarios desde CSV
- [ ] **Backup**: Exportar configuración de roles
- [ ] **Dashboard**: Estadísticas de uso del sistema

## 📞 Soporte

Para dudas o problemas con el módulo de ajustes, contactar al equipo de desarrollo.

---
**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Desarrollado para**: ERP Publicidad Vial Imagen
