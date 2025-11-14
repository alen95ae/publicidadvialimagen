# 🔐 Configuración de Variables de Entorno para Migración

Para ejecutar el script de migración de imágenes, necesitas configurar las siguientes variables de entorno en tu archivo `.env.local` (en la raíz del proyecto).

## 📝 Variables requeridas

```bash
# Airtable Configuration
AIRTABLE_API_KEY=tu_api_key_de_airtable_aqui
AIRTABLE_BASE_ID=tu_base_id_de_airtable_aqui

# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui_NO_la_anon_key
SUPABASE_BUCKET_NAME=nombre_del_bucket
```

## 🔍 ¿Dónde obtener cada valor?

### 1. AIRTABLE_API_KEY

1. Ve a https://airtable.com/create/tokens
2. Crea un token con permisos de lectura para tu base
3. Copia el token aquí

**Formato esperado**: `patXXXXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 2. AIRTABLE_BASE_ID

1. Abre tu base de Airtable en el navegador
2. La URL se ve así: `https://airtable.com/appXXXXXXXXXXX/...`
3. El ID es la parte que empieza con `app`

**Formato esperado**: `appXXXXXXXXXXXXXX`

### 3. SUPABASE_URL

1. Ve a tu proyecto en https://supabase.com
2. Ve a **Settings** > **API** 
3. Copia el **Project URL**

**Formato esperado**: `https://xxxxxxxxxxxxx.supabase.co`

### 4. SUPABASE_SERVICE_ROLE_KEY

1. Ve a tu proyecto en https://supabase.com
2. Ve a **Settings** > **API**
3. En **Project API keys**, busca `service_role`
4. Haz clic en el ícono del ojo para revelar la key
5. Cópiala

⚠️ **IMPORTANTE**: 
- Usa la **service_role** key, NO la **anon** key
- Esta key tiene acceso completo a tu proyecto
- Guárdala de forma segura y NUNCA la subas a Git
- El archivo `.env.local` ya está en `.gitignore`

**Formato esperado**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ...` (muy largo)

### 5. SUPABASE_BUCKET_NAME

1. Ve a **Storage** en tu proyecto de Supabase
2. Si no tienes un bucket, créalo:
   - Haz clic en **New bucket**
   - Nombre: `publicidad-images` (o el que prefieras)
   - **Public bucket**: ✅ (recomendado para imágenes públicas)
   - **File size limit**: 5MB (o más si tienes imágenes grandes)
   - Haz clic en **Create bucket**
3. Copia el nombre del bucket

**Formato esperado**: `publicidad-images` (o el nombre que hayas elegido)

## ✅ Verificación

Después de configurar todas las variables, verifica que:

1. El archivo `.env.local` existe en la raíz del proyecto
2. Todas las variables están sin espacios antes o después del `=`
3. No hay comillas alrededor de los valores
4. El archivo `.env.local` está en `.gitignore` (ya debería estarlo)

## 🚀 Ejemplo completo

```bash
# .env.local

AIRTABLE_API_KEY=patAbCdEfGhIjKlMnOpQrSt.1234567890abcdefghijklmnopqrstuvwxyz
AIRTABLE_BASE_ID=appXyZ123456789
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjc4OTAxMjM0LCJleHAiOjE5OTQ0NzcyMzR9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SUPABASE_BUCKET_NAME=publicidad-images
```

## 🐛 Problemas comunes

### "Missing environment variables"
- Verifica que el archivo se llama exactamente `.env.local`
- Verifica que está en la raíz del proyecto `publicidadvialimagen.erp/`
- Verifica que todas las variables están presentes

### "AIRTABLE_API_KEY is invalid"
- Verifica que el token tiene permisos para leer la base
- Verifica que no has copiado espacios al inicio o final

### "SUPABASE_SERVICE_ROLE_KEY is invalid"
- Verifica que es la service_role key y no la anon key
- La service_role key es más larga que la anon key

### "Bucket not found"
- Verifica que el bucket existe en Storage
- Verifica que el nombre coincide exactamente (case-sensitive)

