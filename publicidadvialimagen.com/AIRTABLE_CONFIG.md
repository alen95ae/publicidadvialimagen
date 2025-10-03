# Configuración de Airtable para la Web Pública

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto de la web con las mismas credenciales que el ERP:

```env
AIRTABLE_API_KEY=tu_misma_api_key_del_erp
AIRTABLE_BASE_ID=tu_mismo_base_id_del_erp
```

## Nota Importante

Las credenciales deben ser **exactamente las mismas** que las del ERP para que ambos proyectos accedan a la misma base de datos de Airtable.

Puedes copiarlas desde:
```
/Users/alen_ae/Downloads/publicidadvialimagen/publicidadvialimagen.erp/.env.local
```

## Después de configurar

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Visita la página de vallas: `http://localhost:3001/billboards`
3. Deberías ver los soportes con estado "DISPONIBLE" de Airtable

## Qué se muestra en la web

La web pública **solo muestra soportes con estado "DISPONIBLE"** de Airtable.
Los soportes ocupados, reservados o no disponibles no se muestran al público.
