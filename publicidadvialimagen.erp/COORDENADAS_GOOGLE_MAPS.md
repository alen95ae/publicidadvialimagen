# Extracción Automática de Coordenadas de Google Maps

## 📍 ¿Qué hace este sistema?

El sistema extrae automáticamente las coordenadas (latitud y longitud) de los enlaces de Google Maps que tienes en Airtable y las guarda en los campos `Latitud` y `Longitud`.

## 🚀 Cómo usar

### Opción 1: Extracción automática al guardar (Recomendado)

Cuando edites un soporte en el ERP y cambies el enlace de Google Maps, el sistema **automáticamente** extraerá las coordenadas y las guardará. No necesitas hacer nada más.

### Opción 2: Extracción masiva por API

Si necesitas extraer coordenadas de todos los soportes existentes, puedes usar el endpoint:

```bash
# Extraer coordenadas de todos los soportes que no las tienen
GET http://localhost:3000/api/extract-coordinates

# Extraer solo los primeros 50
GET http://localhost:3000/api/extract-coordinates?limit=50

# Forzar actualización de todos (incluso los que ya tienen coordenadas)
GET http://localhost:3000/api/extract-coordinates?force=true
```

## 📊 Formatos de enlaces soportados

El sistema puede extraer coordenadas de estos formatos de enlaces de Google Maps:

1. **Enlaces acortados**: `https://goo.gl/maps/abc123`
2. **Enlaces modernos**: `https://maps.app.goo.gl/abc123`
3. **Enlaces completos**: `https://www.google.com/maps/@-16.537074,-68.087067,17z`
4. **Búsquedas**: `https://www.google.com/maps/search/-16.498835,-68.164877`
5. **Lugares**: `https://www.google.com/maps/place/.../@-16.537074,-68.087067`

## ✅ Estado actual

- **Total de soportes**: 306
- **Con coordenadas**: 294 (96%)
- **Sin coordenadas**: 12 (4%)

## 🔧 Mantenimiento

Si agregas nuevos soportes con enlaces de Google Maps, las coordenadas se extraerán automáticamente. Si algunos soportes no tienen coordenadas, puedes ejecutar:

```bash
curl http://localhost:3000/api/extract-coordinates
```

## 📝 Notas técnicas

- El sistema sigue automáticamente los enlaces acortados (goo.gl) para obtener las coordenadas
- Si un enlace no tiene coordenadas, el sistema lo marca como error pero continúa con los demás
- Los mapas del ERP y la web usan estas coordenadas para mostrar la ubicación exacta de cada soporte

