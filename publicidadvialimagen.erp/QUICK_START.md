# Quick Start - Airtable Integration

## 1. Instalar Airtable

```bash
npm install airtable --legacy-peer-deps
```

## 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
```

## 3. Obtener Credenciales de Airtable

### API Key:
1. Ve a [Airtable Account](https://airtable.com/account)
2. En la sección "API" genera una nueva API key
3. Copia la API key

### Base ID:
1. Ve a tu base de datos en Airtable
2. En la URL, el Base ID es la parte después de `/app` y antes del primer `/`
3. Ejemplo: `https://airtable.com/appXXXXXXXXXXXXXX/...` → Base ID es `appXXXXXXXXXXXXXX`

## 4. Crear Tabla en Airtable

Crea una tabla llamada **"Soportes"** con estos campos:

- **Codigo** (Single line text)
- **Titulo** (Single line text)  
- **Tipo Soporte** (Single select) - Opciones: Vallas Publicitarias, Pantallas LED, Murales, Publicidad Móvil
- **Estado** (Single select) - Opciones: disponible, ocupado, reservado, no_disponible
- **Ancho** (Number)
- **Alto** (Number)
- **Ciudad** (Single line text)
- **Precio Mes** (Currency)
- **Impactos Diarios** (Number)
- **Ubicacion URL** (URL)
- **Notas** (Long text)

## 5. Probar el Endpoint

1. Ejecuta el proyecto: `npm run dev`
2. Abre en el navegador: `http://localhost:3000/api/soportes`
3. Deberías ver un JSON con todos los soportes de tu tabla Airtable

## 6. Crear un Soporte

Puedes probar crear un soporte con POST:

```bash
curl -X POST http://localhost:3000/api/soportes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "V001",
    "title": "Valla Principal",
    "type": "Vallas Publicitarias",
    "status": "disponible",
    "widthM": 3.5,
    "heightM": 2.5,
    "city": "La Paz",
    "priceMonth": 1500
  }'
```

¡Listo! Tu ERP ahora funciona con Airtable. 🚀
