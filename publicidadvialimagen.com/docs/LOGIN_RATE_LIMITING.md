# Rate Limiting Específico para Login

## Resumen

Se ha implementado rate limiting específico para el endpoint `/api/auth/login` para proteger contra ataques de fuerza bruta.

## Configuración

- **Máximo de intentos**: 5 por IP
- **Ventana de tiempo**: 15 minutos
- **Clave Redis**: `login:attempts:{ip}`
- **Backoff progresivo**: Cada intento fallido incrementa el contador

## Comportamiento

### Flujo de Protección

1. **Antes de validar credenciales**: Se verifica el rate limit
2. **Si se excede el límite**: Se responde con HTTP 429
3. **Mensaje genérico**: "Too many login attempts. Try again later."
4. **Header Retry-After**: Indica segundos hasta que se puede intentar de nuevo

### Respuesta HTTP 429

```json
{
  "error": "Too many login attempts. Try again later.",
  "retryAfter": 900
}
```

**Headers incluidos:**
- `Retry-After`: Segundos hasta el próximo intento permitido
- `X-RateLimit-Limit`: 5
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: Timestamp de cuando expira el bloqueo

### Backoff Progresivo

- Cada intento de login (exitoso o fallido) incrementa el contador
- Tras 5 intentos, se bloquea hasta que expire el TTL (15 minutos)
- Los intentos fallidos previos siguen contando incluso si hay un login exitoso

## Implementación Técnica

### Archivos

- **`lib/login-rate-limiter.ts`**: Rate limiter específico para login
- **`app/api/auth/login/route.ts`**: Integración del rate limiting

### Compatibilidad

- ✅ Edge Runtime compatible
- ✅ Upstash Redis en producción
- ✅ Memoria en desarrollo (fallback automático)
- ✅ Fail-open: Si Redis falla, permite la request (no bloquea usuarios legítimos)

### Integración con Sistema Existente

- ✅ No modifica bot detection existente
- ✅ No modifica Zod schemas
- ✅ No modifica lógica de autenticación (bcrypt, JWT)
- ✅ Se ejecuta ANTES de validar credenciales
- ✅ Se ejecuta DESPUÉS de bot-protection general

## Seguridad

### Protecciones Implementadas

1. **Fuerza bruta**: Máximo 5 intentos por IP
2. **Timing attack mitigation**: Siempre ejecuta bcrypt.compare (incluso si usuario no existe)
3. **Mensajes genéricos**: No revela si el usuario existe o no
4. **Backoff progresivo**: Bloqueo temporal tras exceder límite

### UX

- ✅ No bloquea usuarios legítimos (5 intentos es suficiente)
- ✅ Mensajes claros y útiles
- ✅ Header Retry-After para mostrar cuándo puede intentar de nuevo
- ✅ No afecta login exitoso (solo cuenta intentos)

## Monitoreo

Los logs incluyen:
- Intentos bloqueados por rate limit
- Intentos restantes en cada request
- IPs que exceden el límite

Ejemplo de log:
```
[abc123] Login bloqueado por rate limit
[def456] Login intento: us***@domain.com (intentos restantes: 3)
```

## Configuración

Las variables de entorno requeridas (ya configuradas):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

En desarrollo, si Redis no está disponible, se usa automáticamente un rate limiter en memoria.

