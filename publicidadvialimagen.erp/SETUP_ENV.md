# Configuración de Variables de Entorno

## Error: Internal Server Error

El error interno del servidor se debe a que faltan las variables de entorno necesarias para conectar con Airtable.

## Solución

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Variables de Airtable (OBLIGATORIAS)
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX

# Variables adicionales para el ERP
AIRTABLE_TABLE_SOPORTES=tblXXXXXXXXXXXXXX
AIRTABLE_TABLE_CONTACTOS=tblXXXXXXXXXXXXXX
AIRTABLE_TABLE_MENSAJES=tblXXXXXXXXXXXXXX
AIRTABLE_TABLE_DUENOS_CASA=tblXXXXXXXXXXXXXX

# Variables de autenticación (si usas Kinde)
KINDE_CLIENT_ID=your_kinde_client_id
KINDE_CLIENT_SECRET=your_kinde_client_secret
KINDE_ISSUER_URL=https://your-domain.kinde.com
KINDE_SITE_URL=http://localhost:3002
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3002
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3002/panel

# URL base de la aplicación
NEXT_PUBLIC_BASE_URL=http://localhost:3002
```

## Cómo obtener los valores de Airtable:

### 1. AIRTABLE_BASE_ID
- Ve a tu base de datos en Airtable
- En la URL verás algo como: `https://airtable.com/appXXXXXXXXXXXXXX`
- El `appXXXXXXXXXXXXXX` es tu BASE_ID

### 2. AIRTABLE_API_KEY
- Ve a tu perfil en Airtable: https://airtable.com/account
- En la sección "API" genera una nueva API Key
- Copia la key que empieza con `key`

### 3. AIRTABLE_TABLE_* (IDs de tablas)
- En tu base de datos, haz clic derecho en cada tabla
- Selecciona "Copy table ID"
- O ve a la URL de la tabla y copia el ID que aparece después de `/tbl`

## Después de configurar:

1. Crea el archivo `.env.local` con las variables
2. Reinicia la aplicación: `npm run dev`
3. La aplicación debería funcionar correctamente

## Estructura de tablas necesarias en Airtable:

### Tabla "Soportes":
- Código (Single line text)
- Título (Single line text)
- Tipo de soporte (Single select)
- Estado (Single select)
- Ancho (Number)
- Alto (Number)
- Área total (Number)
- Ciudad (Single line text)
- País (Single line text)
- Precio por mes (Currency)
- Impactos diarios (Number)
- Enlace Google Maps (URL)
- Latitud (Number)
- Longitud (Number)
- Iluminación (Checkbox)
- Dirección / Notas (Long text)
- Propietario (Single line text)
- Imagen principal (Attachment)
- Imagen secundaria 1 (Attachment)
- Imagen secundaria 2 (Attachment)

### Tabla "Contactos":
- Nombre (Single line text)
- Email (Email)
- Teléfono (Phone number)
- Empresa (Single line text)
- Tipo de Contacto (Single select)
- Relación (Single select)

### Tabla "Mensajes":
- Nombre (Single line text)
- Email (Email)
- Teléfono (Phone number)
- Empresa (Single line text)
- Mensaje (Long text)
- Fecha (Date)
- Estado (Single select)

### Tabla "Dueños de Casa":
- Nombre (Single line text)
- Tipo Propietario (Single select)
- Estado (Single select)
