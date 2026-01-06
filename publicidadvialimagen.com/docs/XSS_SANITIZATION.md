# Sanitización XSS de Inputs de Usuario

## Resumen

Se ha implementado sanitización XSS en backend para neutralizar payloads almacenados antes de guardar en base de datos.

## Implementación

### Archivo Principal

**`lib/sanitize.ts`**
- Función `sanitizeText()`: Elimina todas las etiquetas HTML y atributos peligrosos
- Usa DOMPurify con JSDOM para modo server-side
- Política MUY restrictiva: solo texto plano

### Campos Sanitizados

**Campos de texto libre (se sanitizan):**
- `nombre` / `name`
- `mensaje` / `message`
- `empresa` / `company`
- `contacto`
- `comentarios`

**Campos NO sanitizados (tienen formato específico):**
- `email` (validado por Zod como email)
- `telefono` / `phone` (validado por Zod)
- `password` (hash, nunca texto plano)
- `tokens` (tokens de autenticación)
- `ids` (UUIDs, códigos)
- `fechas` (formato ISO)
- `mesesAlquiler` (número)
- `soporte` (código específico)
- `serviciosAdicionales` (array validado)

## Endpoints Actualizados

1. **`app/api/form/submit/route.ts`**
   - Sanitiza: `nombre`, `empresa`, `mensaje`

2. **`app/api/messages/route.ts`**
   - Sanitiza: `nombre`, `empresa`, `mensaje`
   - También aplica sanitización a datos enviados a Airtable (fallback)

3. **`app/api/solicitudes/route.ts`**
   - Sanitiza: `empresa`, `contacto`, `comentarios`

## Flujo de Protección

1. **Validación Zod** (formato, longitud, tipo)
2. **Sanitización XSS** (eliminar HTML)
3. **Guardado en BD** (datos limpios)

## Ejemplo de Sanitización

**Input:**
```
<script>alert(1)</script> Hola <b>mundo</b> <img src=x onerror=alert(2)>
```

**Output:**
```
alert(1) Hola mundo
```

## Por qué Backend (Defensa en Profundidad)

1. **React escapa por defecto**, pero:
   - No todos los componentes usan React
   - Puede haber renderizado directo de datos
   - Protege contra errores de implementación

2. **CSP ayuda**, pero:
   - No previene almacenamiento de payloads
   - No protege si CSP se relaja en el futuro
   - Payloads almacenados pueden ejecutarse en otros contextos

3. **Sanitización en backend:**
   - Neutraliza payloads antes de almacenar
   - Protege contra XSS almacenado (Stored XSS)
   - Funciona independientemente del frontend

## Nota sobre React

React escapa automáticamente el contenido renderizado en JSX:
```jsx
<div>{mensaje}</div> // Seguro: React escapa HTML
```

Sin embargo, la sanitización backend es defensa en profundidad y protege contra:
- Renderizado directo de HTML (`dangerouslySetInnerHTML`)
- Errores de implementación
- Contextos no-React (emails, exports, etc.)

## Configuración DOMPurify

**Política actual (MUY restrictiva):**
- `ALLOWED_TAGS: []` - No permite ninguna etiqueta HTML
- `ALLOWED_ATTR: []` - No permite ningún atributo
- `KEEP_CONTENT: true` - Mantiene el contenido de texto
- `ALLOW_DATA_ATTR: false` - No permite data attributes
- `ALLOW_UNKNOWN_PROTOCOLS: false` - No permite protocolos desconocidos

**Resultado:** Solo texto plano, sin HTML ejecutable.

## Verificación

Para verificar que la sanitización funciona:

1. **Enviar payload XSS en formulario:**
   ```
   Nombre: <script>alert(1)</script>Test
   Mensaje: <img src=x onerror=alert(2)>
   ```

2. **Verificar en BD:**
   - Los datos almacenados deben ser texto plano
   - No debe haber etiquetas HTML

3. **Verificar en frontend:**
   - Al renderizar, no debe ejecutarse JavaScript
   - El texto debe mostrarse como texto plano

## Dependencias

- `dompurify`: Sanitización HTML
- `jsdom`: Window object para DOMPurify en server-side
- `@types/dompurify`: Tipos TypeScript
- `@types/jsdom`: Tipos TypeScript

## No Modifica

- ✅ Lógica de negocio
- ✅ UX del frontend
- ✅ Autenticación
- ✅ Bot protection
- ✅ Rate limiting
- ✅ Validación Zod (se mantiene intacta)

