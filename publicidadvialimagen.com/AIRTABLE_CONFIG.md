# Configuración de Airtable

## Variables de entorno necesarias

Para que los mensajes se guarden en Airtable, necesitas crear un archivo `.env.local` en la raíz del proyecto con estas variables:

```env
# Variables de Airtable
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_TABLE_CONTACTOS=tblXXXXXXXXXXXXXX
AIRTABLE_TABLE_MENSAJES=tblXXXXXXXXXXXXXX
```

## Cómo obtener estos valores:

### 1. AIRTABLE_BASE_ID
- Ve a tu base de datos en Airtable
- En la URL verás algo como: `https://airtable.com/appXXXXXXXXXXXXXX`
- El `appXXXXXXXXXXXXXX` es tu BASE_ID

### 2. AIRTABLE_API_KEY
- Ve a tu perfil en Airtable: https://airtable.com/account
- En la sección "API" genera una nueva API Key
- Copia la key que empieza con `key`

### 3. AIRTABLE_TABLE_CONTACTOS y AIRTABLE_TABLE_MENSAJES
- En tu base de datos, haz clic derecho en cada tabla
- Selecciona "Copy table ID"
- O ve a la URL de la tabla y copia el ID que aparece después de `/tbl`

## Estructura de tablas necesarias:

### Tabla "Contactos" (AIRTABLE_TABLE_CONTACTOS):
- Nombre (Single line text)
- Email (Email)
- Teléfono (Phone number)
- Empresa (Single line text)
- Tipo de Contacto (Single select: Individual, Compañía)
- Relación (Single select: Cliente, Proveedor, Ambos)

### Tabla "Mensajes" (AIRTABLE_TABLE_MENSAJES):
- Nombre (Single line text)
- Email (Email)
- Teléfono (Phone number)
- Empresa (Single line text)
- Mensaje (Long text)
- Fecha (Date)
- Estado (Single select: NUEVO, LEÍDO, CONTESTADO)

## Después de configurar:

1. Crea el archivo `.env.local` con las variables
2. Reinicia la aplicación: `npm run dev:3001`
3. Prueba el formulario - los mensajes deberían guardarse en Airtable
