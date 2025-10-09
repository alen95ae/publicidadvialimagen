# Configuración de Kinde Auth

## Problema Actual

El error que estás viendo es porque:

1. **No tienes un archivo `.env.local`** con las variables de entorno
2. **La URL de callback no está configurada en Kinde** para `http://localhost:3001/auth/callback`
3. **El Client ID aparece como `undefined`** porque no está configurado

## Solución

### Paso 1: Crear archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con este contenido:

```env
# Kinde Authentication Configuration
KINDE_CLIENT_ID=b0904e67cf0047d9bb1556b53b0f53ca
KINDE_CLIENT_SECRET=5BDl35OiifU9eD52GPg4ouzaHFoZZM5LmKLF05H4Dq8qiuCXO1fy
KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
KINDE_SITE_URL=http://localhost:3001
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3001/login
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3001/panel

# Variables públicas para el cliente
NEXT_PUBLIC_KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
NEXT_PUBLIC_KINDE_CLIENT_ID=b0904e67cf0047d9bb1556b53b0f53ca
```

### Paso 2: Configurar URLs de Callback en Kinde

1. Ve a tu dashboard de Kinde: https://publicidadvialimagen.kinde.com
2. Ve a "Settings" > "Applications"
3. En "Allowed callback URLs", agrega:
   - `http://localhost:3001/auth/callback`
   - `http://localhost:3000/auth/callback` (por si usas el puerto 3000)
4. En "Allowed logout redirect URLs", agrega:
   - `http://localhost:3001/login`
   - `http://localhost:3000/login`
5. Guarda los cambios

### Paso 3: Reiniciar la aplicación

```bash
npm run dev:3001
```

## URLs que necesitas agregar en Kinde

### Callback URLs:
- `http://localhost:3001/auth/callback`
- `http://localhost:3000/auth/callback`

### Logout Redirect URLs:
- `http://localhost:3001/login`
- `http://localhost:3000/login`

### Post Login Redirect URLs:
- `http://localhost:3001/panel`
- `http://localhost:3000/panel`

## Verificación

Después de hacer estos cambios:

1. ✅ El Client ID ya no aparecerá como `undefined`
2. ✅ La redirección funcionará correctamente
3. ✅ Podrás cambiar tu contraseña en Kinde
4. ✅ Regresarás a tu aplicación después del cambio

## Nota Importante

El cambio de contraseña ahora funciona redirigiendo a Kinde, que es la forma segura y recomendada. Una vez que cambies la contraseña en Kinde, podrás usar la nueva contraseña para iniciar sesión.
