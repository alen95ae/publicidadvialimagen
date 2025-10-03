# 🚀 Instalación Rápida - Módulo de Usuarios

## Pasos para activar el módulo

### 1️⃣ Configurar Variables de Entorno

Verifica que tu archivo `.env.local` tenga:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 2️⃣ Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Copia el contenido de `supabase_user_module_migration.sql`
4. Pégalo en el editor y haz clic en **RUN**
5. Verifica que las tablas se crearon correctamente:
   - `favoritos`
   - `cotizaciones`
   - `mensajes`

### 3️⃣ Configurar Proveedores OAuth (Opcional)

#### Para Google:

1. Ve a Supabase Dashboard > **Authentication** > **Providers**
2. Habilita **Google**
3. En [Google Cloud Console](https://console.cloud.google.com/):
   - Crea un proyecto OAuth 2.0
   - Obtén Client ID y Client Secret
4. Pega las credenciales en Supabase
5. Añade estas URLs autorizadas:
   - `https://tu-proyecto.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (desarrollo)

#### Para Facebook:

1. Ve a Supabase Dashboard > **Authentication** > **Providers**
2. Habilita **Facebook**
3. En [Facebook Developers](https://developers.facebook.com/):
   - Crea una app
   - Obtén App ID y App Secret
4. Pega las credenciales en Supabase
5. Añade la URL de callback en Facebook

### 4️⃣ Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Reiniciar
npm run dev
# o
pnpm dev
```

## ✅ Verificar que Funciona

1. **Registro**: Ve a http://localhost:3000/register
2. **Login**: Ve a http://localhost:3000/login
3. **Dashboard**: Después de iniciar sesión, ve a http://localhost:3000/account

## 🎯 Rutas Disponibles

| Ruta | Descripción |
|------|-------------|
| `/login` | Iniciar sesión |
| `/register` | Crear cuenta nueva |
| `/forgot-password` | Recuperar contraseña |
| `/account` | Dashboard del usuario |
| `/auth/callback` | Callback para OAuth |
| `/auth/reset-password` | Resetear contraseña |

## 🔧 Usar el Botón de Favoritos

En cualquier página donde muestres soportes (vallas), añade:

```tsx
import FavoriteButton from '@/components/favorite-button'

<FavoriteButton 
  soporteId={soporte.id}
  variant="outline"
  size="icon"
  showText={true}
/>
```

## 📱 Cómo Usar en tus Componentes

### Obtener el usuario actual:

```tsx
import { useAuth } from '@/hooks/use-auth'

function MiComponente() {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Cargando...</div>
  if (!user) return <div>No logueado</div>
  
  return <div>Hola, {user.email}</div>
}
```

### Verificar si está logueado:

```tsx
const { user } = useAuth()

if (user) {
  // Usuario logueado
} else {
  // No logueado
}
```

## 🐛 Problemas Comunes

### El login no funciona
- ✅ Verifica que las variables de entorno estén correctas
- ✅ Reinicia el servidor de desarrollo
- ✅ Revisa la consola del navegador para errores

### OAuth no redirecciona
- ✅ Verifica las URLs de callback en Google/Facebook
- ✅ Asegúrate de que el dominio esté autorizado
- ✅ Revisa Supabase Dashboard > Logs

### No se cargan los favoritos
- ✅ Verifica que el script SQL se ejecutó correctamente
- ✅ Revisa Supabase Dashboard > Table Editor
- ✅ Verifica que la tabla `soportes` existe

### Error de RLS (Row Level Security)
- ✅ Ejecuta de nuevo el script SQL
- ✅ Verifica las políticas en Supabase Dashboard > Authentication > Policies

## 📚 Documentación Completa

Para más detalles, consulta: [USER_MODULE_README.md](./USER_MODULE_README.md)

## 🎉 ¡Listo!

El módulo de usuarios está completamente funcional. Ahora puedes:
- ✅ Registrar usuarios
- ✅ Login con email, Google y Facebook
- ✅ Gestionar favoritos
- ✅ Ver cotizaciones y mensajes
- ✅ Cambiar contraseña
- ✅ Editar perfil

---

**¿Necesitas ayuda?** Revisa la documentación completa o contacta al equipo de desarrollo.

