# Módulo de Usuarios - Publicidad Vial Imagen

Este documento describe el módulo completo de usuarios implementado para la aplicación Next.js con Supabase.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Estructura de Archivos](#estructura-de-archivos)
- [Configuración Inicial](#configuración-inicial)
- [Uso](#uso)
- [Base de Datos](#base-de-datos)
- [Componentes](#componentes)

## ✨ Características

### Autenticación
- ✅ Registro con email y contraseña
- ✅ Login con email y contraseña
- ✅ Login con Google OAuth
- ✅ Login con Facebook OAuth
- ✅ Recuperación de contraseña (magic link)
- ✅ Actualización de contraseña
- ✅ Cierre de sesión

### Dashboard de Usuario (`/account`)
- ✅ **Perfil**: Ver y editar información personal (nombre, apellido, email)
- ✅ **Favoritos**: Guardar y gestionar soportes publicitarios favoritos
- ✅ **Cambiar Contraseña**: Actualizar contraseña de forma segura
- ✅ **Cotizaciones**: Ver solicitudes de cotización enviadas y sus respuestas
- ✅ **Mensajes**: Ver mensajes recibidos y respuestas

### Seguridad
- ✅ Middleware para proteger rutas privadas
- ✅ Row Level Security (RLS) en Supabase
- ✅ Redirección automática a login si no está autenticado

## 📁 Estructura de Archivos

```
publicidadvialimagen.com/
├── app/
│   ├── account/
│   │   ├── page.tsx                    # Dashboard principal
│   │   └── components/
│   │       ├── ProfileTab.tsx          # Tab de perfil
│   │       ├── FavoritesTab.tsx        # Tab de favoritos
│   │       ├── PasswordTab.tsx         # Tab de contraseña
│   │       ├── QuotesTab.tsx           # Tab de cotizaciones
│   │       └── MessagesTab.tsx         # Tab de mensajes
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts                # Callback OAuth
│   │   └── reset-password/
│   │       └── page.tsx                # Página de reset de contraseña
│   ├── login/
│   │   └── page.tsx                    # Página de login
│   ├── register/
│   │   └── page.tsx                    # Página de registro
│   └── forgot-password/
│       └── page.tsx                    # Página de recuperar contraseña
├── components/
│   ├── header.tsx                      # Header actualizado con UserMenu
│   ├── user-menu.tsx                   # Menú de usuario
│   └── favorite-button.tsx             # Botón de favoritos reutilizable
├── hooks/
│   ├── use-auth.ts                     # Hook de autenticación
│   └── use-favorites.ts                # Hook de favoritos
├── middleware.ts                       # Protección de rutas
└── supabase_user_module_migration.sql  # Script SQL para BD

```

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Asegúrate de tener estas variables en tu archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 2. Configurar OAuth en Supabase

#### Google OAuth:
1. Ve a Supabase Dashboard > Authentication > Providers
2. Habilita Google
3. Configura las credenciales de Google Cloud Console
4. Añade la URL de callback: `https://tu-proyecto.supabase.co/auth/v1/callback`
5. Añade tu dominio a las URLs autorizadas

#### Facebook OAuth:
1. Ve a Supabase Dashboard > Authentication > Providers
2. Habilita Facebook
3. Configura las credenciales de Facebook Developers
4. Añade la URL de callback: `https://tu-proyecto.supabase.co/auth/v1/callback`

### 3. Ejecutar Script SQL

1. Abre Supabase Dashboard > SQL Editor
2. Copia y pega el contenido de `supabase_user_module_migration.sql`
3. Ejecuta el script para crear las tablas y políticas RLS

### 4. Verificar Tabla Soportes

Asegúrate de que tu tabla `soportes` existe y tiene al menos estos campos:
- `id` (UUID)
- `codigo` (TEXT)
- `nombre` (TEXT)
- `ubicacion` (TEXT)
- `precio_mensual` (NUMERIC)
- `ciudad` (TEXT)
- `disponible` (BOOLEAN)

## 📖 Uso

### Hook de Autenticación (`useAuth`)

```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { 
    user,              // Usuario actual
    loading,           // Estado de carga
    signUp,            // Función de registro
    signIn,            // Función de login
    signInWithGoogle,  // Login con Google
    signInWithFacebook,// Login con Facebook
    signOut,           // Cerrar sesión
    resetPassword,     // Recuperar contraseña
    updatePassword,    // Actualizar contraseña
    updateProfile      // Actualizar perfil
  } = useAuth()

  // Ejemplo: Login
  const handleLogin = async () => {
    const { error } = await signIn({
      email: 'user@email.com',
      password: 'password'
    })
    if (error) console.error(error)
  }

  return <div>{user ? user.email : 'No logueado'}</div>
}
```

### Hook de Favoritos (`useFavorites`)

```tsx
import { useFavorites } from '@/hooks/use-favorites'

function MyComponent() {
  const {
    favorites,        // Array de IDs favoritos
    loading,          // Estado de carga
    isFavorite,       // Verificar si es favorito
    addFavorite,      // Añadir favorito
    removeFavorite,   // Eliminar favorito
    toggleFavorite,   // Toggle favorito
    refresh           // Recargar favoritos
  } = useFavorites()

  const soporteId = 'uuid-del-soporte'

  return (
    <button onClick={() => toggleFavorite(soporteId)}>
      {isFavorite(soporteId) ? '❤️' : '🤍'}
    </button>
  )
}
```

### Componente FavoriteButton

```tsx
import FavoriteButton from '@/components/favorite-button'

function SoporteCard({ soporte }) {
  return (
    <div>
      <h3>{soporte.nombre}</h3>
      <FavoriteButton 
        soporteId={soporte.id}
        variant="outline"
        size="icon"
        showText={false}
      />
    </div>
  )
}
```

### Proteger una Ruta

Las rutas que comienzan con `/account` están automáticamente protegidas por el middleware. Para proteger otras rutas, actualiza `middleware.ts`:

```typescript
export const config = {
  matcher: ['/account/:path*', '/checkout/:path*']
}
```

## 🗄️ Base de Datos

### Tabla: favoritos
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- soporte_id: UUID
- created_at: TIMESTAMP
```

### Tabla: cotizaciones
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- empresa: TEXT
- email: TEXT
- telefono: TEXT
- mensaje: TEXT
- estado: TEXT (pendiente, respondida, cerrada)
- respuesta: TEXT
- fecha_respuesta: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabla: mensajes
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- email: TEXT
- asunto: TEXT
- mensaje: TEXT
- leido: BOOLEAN
- respondido: BOOLEAN
- respuesta: TEXT
- fecha_respuesta: TIMESTAMP
- created_at: TIMESTAMP
```

## 🎨 Componentes

### UserMenu
Menú desplegable del usuario que aparece en el header cuando está logueado.

### ProfileTab
Formulario para editar información personal (nombre, apellido). El email no es editable por seguridad.

### FavoritesTab
Lista de soportes guardados como favoritos. Permite eliminarlos y navegar a los detalles.

### PasswordTab
Formulario para cambiar contraseña. No disponible para usuarios de OAuth (Google/Facebook).

### QuotesTab
Lista de cotizaciones enviadas con su estado y respuestas. Permite ver detalles completos.

### MessagesTab
Lista de mensajes recibidos con indicador de no leídos. Permite marcar como leído y ver respuestas.

### FavoriteButton
Botón reutilizable para añadir/quitar favoritos. Se puede usar en tarjetas de soportes.

## 📝 Ejemplo de Integración en Página de Soportes

```tsx
// app/billboards/[id]/page.tsx
import FavoriteButton from '@/components/favorite-button'

export default function BillboardDetailPage({ params }) {
  const { id } = params

  return (
    <div>
      <div className="flex justify-between items-start">
        <h1>Soporte {id}</h1>
        <FavoriteButton 
          soporteId={id}
          variant="outline"
          size="default"
          showText={true}
        />
      </div>
      {/* Resto del contenido */}
    </div>
  )
}
```

## 🔒 Seguridad

- Todas las rutas `/account/*` requieren autenticación
- Row Level Security (RLS) está habilitado en todas las tablas
- Los usuarios solo pueden ver/modificar sus propios datos
- Las contraseñas se gestionan de forma segura por Supabase Auth
- Los tokens de sesión se almacenan en cookies seguras

## 🐛 Solución de Problemas

### Error: "No se puede conectar a Supabase"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de reiniciar el servidor de desarrollo después de cambiar `.env.local`

### Error: "User not found" al hacer login
- Verifica que el usuario haya confirmado su email
- Revisa en Supabase Dashboard > Authentication > Users

### OAuth no funciona
- Verifica que las URLs de callback estén configuradas correctamente
- Asegúrate de tener las credenciales de Google/Facebook configuradas
- Revisa que tu dominio esté en la lista de URLs autorizadas

### Favoritos no se cargan
- Verifica que la tabla `favoritos` existe en Supabase
- Asegúrate de que las políticas RLS estén configuradas
- Revisa que la tabla `soportes` tenga los campos necesarios

## 📧 Soporte

Para problemas o preguntas sobre este módulo, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Fecha**: Octubre 2025  
**Stack**: Next.js 14 + Supabase + TypeScript + Tailwind CSS

