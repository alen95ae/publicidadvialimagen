# 🔐 Configuración de Kinde Auth

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto ERP con las siguientes variables:

```env
# Kinde Authentication
KINDE_CLIENT_ID=ec5f3989fcbe4e1c9a55d271f4a28671
KINDE_CLIENT_SECRET=<tu_client_secret_de_kinde>
KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/panel

# Airtable Configuration (mantener si existen)
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## 🚀 Inicio Rápido

### 1. Obtener Client Secret de Kinde

1. Ve a https://publicidadvialimagen.kinde.com
2. Ve a Settings > Applications
3. Selecciona tu aplicación
4. Copia el **Client Secret**
5. Pégalo en tu archivo `.env.local`

### 2. Configurar URLs en Kinde Dashboard

En el dashboard de Kinde, configura estas URLs:

**Allowed callback URLs:**
- `http://localhost:3000/api/auth/kinde_callback`
- `https://tu-dominio-produccion.com/api/auth/kinde_callback`

**Allowed logout redirect URLs:**
- `http://localhost:3000`
- `https://tu-dominio-produccion.com`

### 3. Iniciar el Servidor

```bash
npm run dev
```

### 4. Acceder a la Aplicación

- **Login**: http://localhost:3000/login
- **Panel**: http://localhost:3000/panel
- **Perfil**: http://localhost:3000/panel/perfil

## 🔑 Funcionalidades

### Autenticación
- ✅ Registro de nuevos usuarios
- ✅ Inicio de sesión
- ✅ Cierre de sesión
- ✅ Persistencia de sesión automática
- ✅ Protección de rutas del panel
- ✅ Server-side authentication (SSR compatible)

### Rutas API Automáticas

El SDK crea automáticamente estas rutas:
- `/api/auth/login` - Iniciar sesión
- `/api/auth/register` - Registrarse
- `/api/auth/logout` - Cerrar sesión
- `/api/auth/kinde_callback` - Callback de OAuth
- `/api/auth/session` - Obtener sesión actual

## 🔐 Uso en Componentes

### Server Components (Recomendado)

```tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"

export default async function ProtectedPage() {
  const { getUser, isAuthenticated } = getKindeServerSession()
  
  if (!(await isAuthenticated())) {
    redirect("/api/auth/login")
  }

  const user = await getUser()
  
  return (
    <div>
      <h1>Hola {user?.given_name}</h1>
    </div>
  )
}
```

### Client Components

```tsx
"use client"

import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"
import { Button } from "@/components/ui/button"

export default function MiComponente() {
  return (
    <LogoutLink>
      <Button>Cerrar sesión</Button>
    </LogoutLink>
  )
}
```

## 🌐 Configuración para Producción

Cuando depliegues a producción, actualiza estas variables en tu hosting:

```env
KINDE_CLIENT_ID=ec5f3989fcbe4e1c9a55d271f4a28671
KINDE_CLIENT_SECRET=<tu_client_secret>
KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
KINDE_SITE_URL=https://tu-dominio-produccion.com
KINDE_POST_LOGOUT_REDIRECT_URL=https://tu-dominio-produccion.com
KINDE_POST_LOGIN_REDIRECT_URL=https://tu-dominio-produccion.com/panel
```

**Importante**: También debes agregar las URLs de producción en el dashboard de Kinde (ver paso 2).

## 📝 Notas

- El SDK de Kinde para Next.js maneja las sesiones automáticamente con cookies
- Compatible con Server Components y App Router
- No necesita configuración de backend adicional
- Funciona en desarrollo y producción
- Compatible con SSR y SSG

## 🔄 Diferencias con NextAuth

Esta implementación usa `@kinde-oss/kinde-auth-nextjs` en lugar de NextAuth porque:
- ✅ Mejor integración con App Router
- ✅ Server Components por defecto
- ✅ No requiere configuración de adaptadores de base de datos
- ✅ Manejo automático de OAuth
- ✅ Mejor seguridad out-of-the-box
