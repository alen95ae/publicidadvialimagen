# Guía de Subida de Imágenes a Supabase

## Configuración Requerida

### 1. Crear bucket en Supabase Storage

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Storage** → **Buckets**
3. Crea un nuevo bucket llamado `soportes`
4. Configura las políticas de acceso según tus necesidades

### 2. Políticas de Storage (Opcional)

Si quieres que las imágenes sean públicas automáticamente:

```sql
-- Permitir lectura pública
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'soportes');

-- Permitir escritura con Service Role (ya funciona por defecto)
```

## Uso desde el Frontend

### Ejemplo con FormData

```typescript
async function crearSoporteConImagenes(formData: FormData) {
  const response = await fetch('/api/soportes', {
    method: 'POST',
    body: formData, // FormData con archivos
  })
  
  return response.json()
}

// En tu componente React
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  
  const formData = new FormData(e.currentTarget)
  
  // Agregar archivos
  const principalInput = document.getElementById('imagen_principal') as HTMLInputElement
  if (principalInput?.files?.[0]) {
    formData.append('imagen_principal', principalInput.files[0])
  }
  
  const secundaria1Input = document.getElementById('imagen_secundaria_1') as HTMLInputElement
  if (secundaria1Input?.files?.[0]) {
    formData.append('imagen_secundaria_1', secundaria1Input.files[0])
  }
  
  const secundaria2Input = document.getElementById('imagen_secundaria_2') as HTMLInputElement
  if (secundaria2Input?.files?.[0]) {
    formData.append('imagen_secundaria_2', secundaria2Input.files[0])
  }
  
  // Agregar otros campos
  formData.append('code', '1-LPZ')
  formData.append('title', 'Mi Soporte')
  formData.append('city', 'La Paz')
  // ... otros campos
  
  const result = await crearSoporteConImagenes(formData)
  console.log('Soporte creado:', result)
}
```

### Ejemplo con JSON (sin imágenes)

```typescript
async function crearSoporteSinImagenes(data: any) {
  const response = await fetch('/api/soportes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  return response.json()
}
```

## Mostrar Imágenes

Las imágenes se guardan en formato JSONB array en Supabase:

```json
{
  "imagen_principal": [{"url": "https://..."}],
  "imagen_secundaria_1": [{"url": "https://..."}],
  "imagen_secundaria_2": [{"url": "https://..."}]
}
```

El helper `soporteToSupport()` ya las convierte automáticamente al formato del frontend:

```typescript
const soporte = soporteToSupport(dataFromSupabase)
// soporte.images es un array de URLs: ["https://...", "https://..."]
```

### En React

```tsx
function SoporteCard({ soporte }: { soporte: any }) {
  const images = soporte.images || []
  
  return (
    <div>
      {images.map((url: string, index: number) => (
        <img 
          key={index}
          src={url} 
          alt={`Imagen ${index + 1}`}
          className="w-full h-auto rounded-lg"
        />
      ))}
    </div>
  )
}
```

## Estructura de Archivos

- `/lib/supabaseUpload.ts` - Función helper para subir imágenes
- `/app/api/soportes/route.ts` - API route que maneja FormData y JSON
- `/app/api/soportes/helpers.ts` - Función `soporteToSupport()` que convierte datos

## Notas

- Las imágenes se guardan en: `soportes/imagenes/{timestamp}-{filename}`
- El formato guardado es: `[{ url: "https://..." }]` (compatible con formato Airtable)
- El helper extrae automáticamente las URLs para el frontend
- El API route soporta tanto FormData (con archivos) como JSON (sin archivos)

