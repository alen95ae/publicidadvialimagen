# Configuración de Imágenes con Airtable

## ✅ Estado Actual: FUNCIONANDO

Las imágenes ahora se leen y muestran correctamente desde Airtable. 

## 📸 Cómo Subir Imágenes Directamente a Airtable

**Temporalmente (hasta el despliegue en Vercel):**

1. Abre tu base de Airtable
2. Ve a la tabla "Soportes"
3. Busca el soporte que quieres editar
4. En las columnas de imágenes (`Imagen principal`, `Imagen secundaria 1`, `Imagen secundaria 2`):
   - Haz clic en el campo de attachment
   - Arrastra o sube tu imagen
   - Airtable la almacenará automáticamente
5. Las imágenes aparecerán automáticamente en el ERP

## ✅ Cambios Implementados

He agregado logging detallado para depurar el problema:
- En `/app/api/soportes/helpers.ts` se registra el procesamiento de imágenes
- En `/app/api/soportes/[id]/route.ts` se registra todo el proceso de actualización

## 🛠️ Soluciones Posibles

### Opción 1: Variable de Entorno (Temporal - Solo producción)

Si tu aplicación está desplegada en un servidor público (Vercel, Netlify, etc.), crea un archivo `.env.local`:

```env
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

Esto convertirá las URLs relativas en absolutas que Airtable puede acceder.

**Limitación:** NO funciona en localhost porque Airtable no puede acceder a tu máquina local.

### Opción 2: Servicio de Almacenamiento en la Nube (Recomendado)

Para una solución robusta, usa un servicio como:

#### A) Cloudinary (Más fácil)
1. Crea cuenta gratuita en [Cloudinary](https://cloudinary.com)
2. Instala el SDK: `npm install cloudinary`
3. Configura variables de entorno:
   ```env
   CLOUDINARY_CLOUD_NAME=tu_cloud_name
   CLOUDINARY_API_KEY=tu_api_key
   CLOUDINARY_API_SECRET=tu_api_secret
   ```

#### B) AWS S3
Más control pero más configuración requerida.

#### C) Vercel Blob Storage
Si usas Vercel, es la opción más integrada.

## 🔍 Cómo Verificar que las Imágenes se Muestran

1. **Abre la consola del navegador (F12)**
2. **Ve a un soporte que tenga imágenes en Airtable**
3. **Revisa los logs en la consola del navegador:**
   - 📥 `Soporte recibido del API` - Muestra todos los datos del soporte
   - 🖼️ `Imágenes en el soporte` - Muestra el array de URLs de imágenes
   - ✅ `Imagen X cargada correctamente` - Confirma que cada imagen se cargó
   - ❌ `Error cargando imagen` - Si alguna imagen falla

4. **Revisa los logs en la terminal del servidor:**
   - 🔍 `Leyendo imágenes desde Airtable` - Muestra los datos raw de Airtable
   - 📸 `URLs de imágenes extraídas` - Muestra las URLs procesadas

## ✅ Qué Deberías Ver

Si todo funciona correctamente:
- En modo visualización: Las imágenes aparecen en la sección "Información Básica"
- Si no hay imágenes: Verás el texto "Sin imágenes"
- Si hay imágenes: Aparecerán en una grilla de 2 columnas

## ⚠️ Si las Imágenes No Aparecen

1. **Verifica en Airtable:**
   - ¿Los campos tienen nombres exactos? `Imagen principal`, `Imagen secundaria 1`, `Imagen secundaria 2`
   - ¿Las imágenes están subidas como attachments?

2. **Verifica los logs:**
   - ¿Se están leyendo las imágenes desde Airtable?
   - ¿Las URLs están llegando al frontend?
   - ¿Hay errores de CORS o de carga?

3. **Revisa el formato:**
   - Las imágenes en Airtable deben ser attachments (tipo archivo adjunto)
   - No deben ser solo URLs en campos de texto

## 🚀 Próximos Pasos

1. **Si estás en producción:** Configura `NEXT_PUBLIC_BASE_URL` en tus variables de entorno
2. **Si estás en desarrollo local:** Considera usar Cloudinary o un servicio similar
3. **Revisa los logs** para ver exactamente qué URLs se están generando

## 💡 Nota Importante

Las imágenes en Airtable se guardan en 3 campos separados:
- `Imagen principal` (data.images[0])
- `Imagen secundaria 1` (data.images[1])
- `Imagen secundaria 2` (data.images[2])

El límite actual es **3 imágenes por soporte**.

