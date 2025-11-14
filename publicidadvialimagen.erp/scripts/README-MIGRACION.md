# Script de Migración de Imágenes: Airtable → Supabase

Este script migra todas las imágenes de los soportes desde Airtable a Supabase Storage.

## 📋 Requisitos Previos

### 1. Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu-service-role-key

# Airtable
AIRTABLE_API_KEY=tu-api-key
AIRTABLE_BASE_ID=appju6bHbflc0O93z
```

### 2. Bucket de Supabase Storage

El bucket `soportes` debe existir en Supabase Storage:

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Storage** → **Buckets**
4. Crea un bucket llamado `soportes` si no existe
5. Configura las políticas de acceso según tus necesidades

### 3. Node.js

Asegúrate de tener Node.js 18+ instalado (para soporte nativo de `fetch`):

```bash
node --version  # Debe ser >= 18.0.0
```

## 🚀 Ejecución

### Opción 1: Con ts-node (Recomendado)

```bash
cd publicidadvialimagen.erp
npx ts-node scripts/migrar-imagenes.ts
```

### Opción 2: Compilar y ejecutar

```bash
# Compilar TypeScript
npx tsc scripts/migrar-imagenes.ts --outDir dist --esModuleInterop --resolveJsonModule

# Ejecutar
node dist/scripts/migrar-imagenes.js
```

## 📊 Qué hace el script

1. **Lee todos los registros** de la tabla "Soportes" en Airtable
2. **Para cada registro con imágenes:**
   - Descarga las imágenes desde las URLs de Airtable
   - Las sube a Supabase Storage en el bucket `soportes/imagenes/`
   - Actualiza el registro en Supabase usando el campo `codigo` como identificador
3. **Guarda las URLs** en formato JSONB array:
   ```json
   {
     "imagen_principal": [{"url": "https://..."}],
     "imagen_secundaria_1": [{"url": "https://..."}],
     "imagen_secundaria_2": [{"url": "https://..."}]
   }
   ```

## 📈 Estadísticas

Al finalizar, el script muestra:
- Total de registros procesados
- Registros con imágenes
- Total de imágenes subidas
- Errores encontrados

## ⚠️ Notas Importantes

- **No duplica imágenes**: Si un soporte ya tiene imágenes en Supabase, el script las actualiza
- **Usa el código como identificador**: El script busca el registro en Supabase usando el campo `codigo`
- **Manejo de errores**: Si una imagen falla, el script continúa con las siguientes
- **Logs detallados**: Verás el progreso de cada imagen subida

## 🔍 Verificación

Después de ejecutar el script, puedes verificar en Supabase:

1. **Storage**: Ve a Storage → soportes → imagenes/ para ver las imágenes subidas
2. **Base de datos**: Consulta la tabla `soportes` para ver los campos `imagen_principal`, `imagen_secundaria_1`, `imagen_secundaria_2`

## 🐛 Solución de Problemas

### Error: "El bucket 'soportes' no existe"
- Crea el bucket manualmente en Supabase Dashboard → Storage → Buckets

### Error: "Faltan variables de entorno"
- Verifica que `.env.local` tenga todas las variables necesarias
- Asegúrate de estar ejecutando el script desde el directorio correcto

### Error: "No se encontró registro con código: XXX"
- El código en Airtable no coincide con ningún registro en Supabase
- Verifica que la migración de datos se haya completado correctamente

### Error de descarga de imágenes
- Verifica que las URLs de Airtable sean accesibles
- Algunas imágenes pueden estar protegidas o eliminadas

