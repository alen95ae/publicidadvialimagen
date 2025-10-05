# 🚀 Inicio Rápido - Autenticación con Kinde

## ⚡ Configuración en 3 Pasos

### Paso 1: Configurar Variables de Entorno

**Opción A - Script Automático (Recomendado)**:
```bash
cd publicidadvialimagen.erp
./setup-kinde.sh
```

**Opción B - Manual**:
Crea el archivo `.env.local` en la raíz de `publicidadvialimagen.erp/` con:

```env
KINDE_CLIENT_ID=b0904e67cf0047d9bb1556b53b0f53ca
KINDE_CLIENT_SECRET=5BDl35OiifU9eD52GPg4ouzaHFoZZM5LmKLF05H4Dq8qiuCXO1fy
KINDE_ISSUER_URL=https://publicidadvialimagen.kinde.com
KINDE_SITE_URL=http://localhost:3001
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3001/login
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3001/panel
```

### Paso 2: Iniciar el Servidor

```bash
npm run dev
```

### Paso 3: Probar la Autenticación

1. Abre tu navegador en: `http://localhost:3000`
2. Serás redirigido automáticamente a `/login`
3. Haz clic en "Iniciar sesión"
4. Completa el login en Kinde
5. ¡Listo! Deberías ver el panel con tu información

## 🎉 ¿Qué Esperar?

### En la Consola del Navegador

Verás logs como estos durante el flujo:

```
📄 Página de login cargada
🔐 Iniciando proceso de login con Kinde...
```

### En la Consola del Servidor

```
🛡️ Middleware ejecutado para: /panel
✅ Usuario autenticado, accediendo a: /panel
✅ Usuario autenticado en panel: tu-email@ejemplo.com
```

### En el Panel

- Tu **nombre completo** y **email** en el header
- Un **avatar** con tus iniciales o foto de Kinde
- Acceso a todos los módulos del ERP
- Menú con opciones de perfil y logout

## ✅ Verificaciones Rápidas

### 1. Variables de Entorno
```bash
# Verifica que el archivo exista
ls -la .env.local

# Debería mostrar el archivo
```

### 2. Rutas de API
```bash
# Verifica que las rutas existan
ls -la app/api/auth/

# Deberías ver el directorio [...kinde]
```

### 3. Dependencias
```bash
# Verifica que Kinde esté instalado
npm list @kinde-oss/kinde-auth-nextjs

# Debería mostrar: @kinde-oss/kinde-auth-nextjs@2.9.2
```

## 🔧 Solución de Problemas

### Error: "Cannot find module @kinde-oss/kinde-auth-nextjs"

```bash
npm install
```

### Error: "Missing environment variables"

Verifica que el archivo `.env.local` existe y tiene todas las variables requeridas.

### Error al redirigir después del login

1. Verifica en tu Dashboard de Kinde que la URL de callback sea:
   - `http://localhost:3000/api/auth/kinde_callback`
2. Verifica que las URLs de redirección permitidas incluyan:
   - `http://localhost:3000/panel`
   - `http://localhost:3000/login`

### El panel no muestra mi información

Abre la consola del navegador (F12) y busca errores. Deberías ver logs con emoji indicando el flujo.

## 📖 Más Información

Para documentación completa, consulta:
- `KINDE_CONFIGURACION.md` - Documentación detallada
- `KINDE_AUTH_SETUP.md` - Guía original de configuración

## 🎯 Próximos Pasos

Una vez que la autenticación funcione:

1. **Personaliza los permisos** en Kinde Dashboard
2. **Configura roles** para diferentes tipos de usuarios
3. **Añade protección** a rutas específicas según roles
4. **Actualiza URLs** para producción cuando despliegues

## 💡 Consejos

- Usa puerto `3000` para el ERP (configuración por defecto)
- Usa puerto `3001` para el sitio web público (si lo necesitas)
- Nunca compartas tu `KINDE_CLIENT_SECRET`
- En producción, actualiza todas las URLs a tu dominio real

---

**¿Problemas?** Revisa los logs en consola, casi siempre indican exactamente qué salió mal.

