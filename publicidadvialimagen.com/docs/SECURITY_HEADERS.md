# HTTP Security Headers

## Resumen

Se han implementado headers de seguridad HTTP estándar para endurecer la aplicación a nivel de producción.

## Headers Implementados

### 1. Content-Security-Policy (CSP)

**Valor:** Política de seguridad de contenido que controla qué recursos puede cargar la página.

**Configuración actual (modo seguro inicial):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https: blob:;
font-src 'self' data: https://fonts.gstatic.com;
connect-src 'self' https: wss:;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests;
```

**Por qué es "modo seguro inicial":**
- Permite `unsafe-inline` y `unsafe-eval` porque Next.js los requiere para:
  - Hot Module Replacement (HMR) en desarrollo
  - Inline scripts generados dinámicamente
  - Estilos inline de componentes
- Permite `https:` wildcard para imágenes y conexiones para:
  - Imágenes desde Supabase Storage
  - APIs externas (Airtable, etc.)
  - Recursos CDN

**Cómo endurecer CSP en el futuro:**
1. **Eliminar `unsafe-inline` y `unsafe-eval`:**
   - Usar nonces generados por Next.js para scripts inline
   - Usar hashes SHA256 para estilos inline específicos
   - Migrar a Server Components donde sea posible

2. **Especificar dominios exactos:**
   - Reemplazar `https:` wildcards con dominios específicos:
     - `img-src 'self' data: https://ibmihmfpogmzofvctmjz.supabase.co`
     - `connect-src 'self' https://api.airtable.com https://ibmihmfpogmzofvctmjz.supabase.co`

3. **Implementar report-uri:**
   - Añadir `report-uri https://tu-endpoint.com/csp-report` para monitorear violaciones
   - Usar servicios como Sentry, DataDog o endpoint propio

4. **Revisar y ajustar:**
   - Monitorear console del navegador para violaciones de CSP
   - Ajustar políticas según necesidades reales de la aplicación

### 2. Strict-Transport-Security (HSTS)

**Valor:** `max-age=63072000; includeSubDomains; preload`

**Aplicación:** Solo en producción

**Efecto:**
- Fuerza conexiones HTTPS por 2 años
- Aplica a todos los subdominios
- Permite inclusión en HSTS preload list de navegadores

### 3. X-Frame-Options

**Valor:** `DENY`

**Efecto:** Previene que la página sea embebida en iframes (protección contra clickjacking)

### 4. X-Content-Type-Options

**Valor:** `nosniff`

**Efecto:** Previene MIME type sniffing, forzando al navegador a respetar el Content-Type declarado

### 5. Referrer-Policy

**Valor:** `strict-origin-when-cross-origin`

**Efecto:**
- Envío completo de referrer en mismo origen
- Solo origen (sin path) en cross-origin
- Sin referrer en downgrade (HTTPS → HTTP)

### 6. Permissions-Policy

**Valor:** `geolocation=(), camera=(), microphone=(), payment=(), usb=(), fullscreen=()`

**Efecto:** Deshabilita APIs del navegador no utilizadas por la aplicación

## Recursos Permitidos

### Scripts
- `'self'`: Scripts del mismo dominio
- `'unsafe-inline'`: Scripts inline (necesario para Next.js)
- `'unsafe-eval'`: eval() (necesario para Next.js HMR)
- `https://www.googletagmanager.com`: Google Tag Manager
- `https://www.google-analytics.com`: Google Analytics

### Estilos
- `'self'`: Estilos del mismo dominio
- `'unsafe-inline'`: Estilos inline (necesario para componentes)
- `https://fonts.googleapis.com`: Google Fonts CSS

### Imágenes
- `'self'`: Imágenes del mismo dominio
- `data:`: Imágenes en base64
- `https:`: Imágenes desde cualquier dominio HTTPS (incluye Supabase)
- `blob:`: Imágenes desde blob URLs

### Fuentes
- `'self'`: Fuentes del mismo dominio
- `data:`: Fuentes embebidas
- `https://fonts.gstatic.com`: Google Fonts

### Conexiones
- `'self'`: Conexiones al mismo dominio
- `https:`: Conexiones HTTPS a cualquier dominio (APIs externas)
- `wss:`: WebSocket Secure (si se usa)

## Compatibilidad

### Servicios Externos Permitidos
- ✅ Google Analytics / Tag Manager
- ✅ Supabase Storage (imágenes)
- ✅ Airtable API
- ✅ Google Fonts
- ✅ Vercel Analytics (carga desde mismo dominio)

### No Afecta
- ✅ Login y autenticación
- ✅ Formularios y APIs
- ✅ Bot protection
- ✅ Rate limiting
- ✅ Recursos estáticos de Next.js

## Verificación

Para verificar que los headers están activos:

1. **Navegador:**
   - Abrir DevTools → Network
   - Seleccionar cualquier request
   - Ver pestaña "Headers" → "Response Headers"

2. **Herramientas online:**
   - https://securityheaders.com
   - https://observatory.mozilla.org

## Notas

- Los headers se aplican globalmente a todas las rutas
- HSTS solo se aplica en producción (no en desarrollo)
- CSP puede necesitar ajustes según uso real de la aplicación
- Monitorear console del navegador para violaciones de CSP

