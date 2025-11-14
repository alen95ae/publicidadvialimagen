# 📦 Script de Migración de Imágenes: Airtable → Supabase Storage

Este script migra automáticamente las imágenes del campo `imagen_principal` de las tablas **productos** y **recursos** desde Airtable hacia Supabase Storage.

## 🚀 Configuración

### 1. Instalar dependencias

```bash
cd publicidadvialimagen.erp
npm install
```

Las dependencias necesarias ya están agregadas al `package.json`:
- `dotenv`
- `@supabase/supabase-js`
- `airtable`
- `node-fetch`
- `@types/node-fetch`
- `ts-node`

### 2. Configurar variables de entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```bash
# Airtable
AIRTABLE_API_KEY=tu_api_key_de_airtable
AIRTABLE_BASE_ID=tu_base_id_de_airtable

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_BUCKET_NAME=nombre_del_bucket
```

#### ⚠️ Importante:
- **SUPABASE_SERVICE_ROLE_KEY**: Usa la **service role key**, NO la anon key. La necesitas para bypassear RLS.
- **SUPABASE_BUCKET_NAME**: Asegúrate de que el bucket ya esté creado en Supabase Storage y sea público (o configura las políticas de acceso apropiadas).

### 3. Verificar que el bucket existe

Antes de ejecutar el script:

1. Ve a tu proyecto de Supabase
2. Ve a **Storage** en el menú lateral
3. Verifica que existe el bucket con el nombre que pusiste en `SUPABASE_BUCKET_NAME`
4. Si no existe, créalo con estos ajustes:
   - **Public bucket**: ✅ (recomendado para imágenes públicas)
   - **File size limit**: según tus necesidades

## 🎯 Ejecución

### Ejecutar el script de migración

```bash
npm run migrate:airtable-images
```

O directamente:

```bash
npx ts-node scripts/migrate-airtable-images.ts
```

## 📋 ¿Qué hace el script?

1. **Valida** que todas las variables de entorno estén configuradas
2. **Conecta** con Airtable y Supabase
3. Para cada tabla (`productos` y `recursos`):
   - Obtiene todos los registros de Airtable
   - Para cada registro:
     - Verifica que tenga un `codigo`
     - Verifica que tenga una imagen en `imagen_principal`
     - Descarga la imagen desde Airtable
     - Sube la imagen a Supabase Storage
     - Obtiene la URL pública de la imagen
     - Actualiza el campo `imagen_principal` en la tabla de Supabase con la nueva URL
4. Muestra un **resumen completo** de la migración

## 📊 Ejemplo de salida

```
🚀 INICIANDO MIGRACIÓN DE IMÁGENES: AIRTABLE → SUPABASE STORAGE

✅ Variables de entorno validadas correctamente

======================================================================
📦 Migrando imágenes de la tabla: "productos"
======================================================================

📊 Total de registros encontrados: 150

📥 [PROD-001] Descargando imagen: lona-premium.jpg
📤 [PROD-001] Subiendo a Storage: productos/PROD-001_1678901234567.jpg
🔗 [PROD-001] URL pública: https://xxx.supabase.co/storage/v1/object/public/...
✅ [PROD-001] Migrado exitosamente

...

======================================================================
📊 RESUMEN - Tabla "productos":
======================================================================
   Procesados: 150
   Migrados:   145 ✅
   Omitidos:   3 ⚠️
   Errores:    2 ❌
======================================================================

[...repite para "recursos"...]

======================================================================
🎉 MIGRACIÓN COMPLETADA
======================================================================
   Total procesados: 300
   Total migrados:   290 ✅
   Total omitidos:   6 ⚠️
   Total errores:    4 ❌
   Duración:         45.32s
======================================================================
```

## 🔍 Detalles técnicos

### Estructura de archivos en Storage

Las imágenes se guardan con esta estructura:

```
productos/
  ├── PROD-001_1678901234567.jpg
  ├── PROD-002_1678901235678.png
  └── ...

recursos/
  ├── REC-001_1678901236789.jpg
  ├── REC-002_1678901237890.png
  └── ...
```

Formato: `{tabla}/{codigo_limpio}_{timestamp}.{ext}`

### Matching entre Airtable y Supabase

El script hace match por el campo `codigo`:
- Si encuentra un registro en Supabase con ese `codigo`, actualiza su `imagen_principal`
- Si NO encuentra el registro, lo omite y continúa

### Manejo de errores

- Si un registro falla, el script continúa con los siguientes
- Al final muestra cuántos errores hubo
- Los errores se muestran con detalles en la consola

### Rate limiting

El script incluye una pausa de **100ms** entre cada imagen para no saturar las APIs.

## ⚠️ Consideraciones

1. **Ejecutar en un entorno seguro**: Este script usa la service role key que tiene acceso total a tu proyecto.

2. **Backup**: Asegúrate de tener backup de tus datos antes de ejecutar la migración.

3. **Idempotencia**: El script usa `upsert: true`, por lo que puedes ejecutarlo múltiples veces sin duplicar imágenes.

4. **Sobrescribe URLs**: El script sobrescribirá el valor actual de `imagen_principal` en Supabase con la nueva URL de Storage.

5. **Primera imagen solamente**: Si un registro en Airtable tiene múltiples imágenes en `imagen_principal`, solo se migrará la primera.

## 🐛 Troubleshooting

### Error: "Missing environment variables"
- Verifica que el archivo `.env.local` existe y tiene todas las variables requeridas

### Error: "Bucket not found"
- Verifica que el bucket existe en Supabase Storage
- Verifica que el nombre en `SUPABASE_BUCKET_NAME` coincide exactamente

### Error: "Permission denied" al subir a Storage
- Verifica que estás usando la **service role key**, no la anon key
- Verifica las políticas de Storage en Supabase

### Error: "Table not found" en Supabase
- Verifica que las tablas `productos` y `recursos` existen en Supabase
- Verifica que tienen la columna `codigo` (TEXT)
- Verifica que tienen la columna `imagen_principal` (TEXT)

### Las imágenes se suben pero no se actualizan las URLs
- Verifica que el campo `codigo` en Supabase coincide exactamente con Airtable (case-sensitive)

## 📝 Notas

- El script puede tardar varios minutos dependiendo de la cantidad de imágenes
- Se recomienda ejecutarlo en horarios de bajo tráfico
- Puedes modificar el delay entre uploads en la línea del `setTimeout`

