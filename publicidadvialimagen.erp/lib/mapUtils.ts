/**
 * Utilidades para mapas
 * Las coordenadas se usan directamente sin corrección
 */

/**
 * Convierte coordenadas a array [lat, lng] para Leaflet
 * Sin corrección - usa coordenadas originales
 */
export function getCoordsForMap(lat: number, lng: number): [number, number] {
  // Usar coordenadas originales sin corrección
  return [lat, lng]
}

