/**
 * Utilidades para corrección de coordenadas entre sistemas de mapas
 * 
 * Google Maps y Esri usan WGS84 directamente
 * OpenStreetMap puede tener un pequeño desvío que se corrige aquí
 */

/**
 * Corrige coordenadas de Google Maps/Esri para que se muestren correctamente en OpenStreetMap
 * Aplica una corrección basada en el offset promedio para Bolivia
 */
export function correctCoordsForOSM(lat: number, lng: number): { lat: number; lng: number } {
  // Offset promedio para Bolivia (ajustar según mediciones)
  // Estos valores son aproximados y pueden necesitar ajuste fino
  const LAT_OFFSET = 0.0001  // Aproximadamente 11 metros al norte
  const LNG_OFFSET = -0.00015  // Aproximadamente 12 metros al oeste
  
  return {
    lat: lat + LAT_OFFSET,
    lng: lng + LNG_OFFSET
  }
}

/**
 * Convierte coordenadas a array [lat, lng] para Leaflet
 * Aplica corrección si se usa OSM
 */
export function getCoordsForMap(lat: number, lng: number, useOSM: boolean = false): [number, number] {
  if (useOSM) {
    const corrected = correctCoordsForOSM(lat, lng)
    return [corrected.lat, corrected.lng]
  }
  // Para Esri/Google Maps, usar coordenadas originales
  return [lat, lng]
}

