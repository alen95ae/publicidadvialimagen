// Coordenadas de las ciudades principales de Bolivia
// Zoom ajustado según el tamaño de cada ciudad para que se vea completa
export const CITY_COORDINATES = {
  "La Paz": {
    center: [-16.5000, -68.1500] as [number, number],
    zoom: 12  // Ciudad grande, necesita zoom más amplio
  },
  "Santa Cruz": {
    center: [-17.7833, -63.1833] as [number, number],
    zoom: 12  // Ciudad muy grande, zoom más amplio (+1)
  },
  "Cochabamba": {
    center: [-17.3833, -66.1667] as [number, number],
    zoom: 11  // Ciudad grande (-1)
  },
  "El Alto": {
    center: [-16.5167, -68.1833] as [number, number],
    zoom: 12  // Ciudad grande
  },
  "Sucre": {
    center: [-19.0500, -65.2500] as [number, number],
    zoom: 13  // Ciudad mediana
  },
  "Potosí": {
    center: [-19.5833, -65.7500] as [number, number],
    zoom: 13  // Ciudad mediana
  },
  "Tarija": {
    center: [-21.5333, -64.7333] as [number, number],
    zoom: 13  // Ciudad mediana
  },
  "Oruro": {
    center: [-17.9833, -67.1500] as [number, number],
    zoom: 13  // Ciudad mediana
  },
  "Trinidad": {
    center: [-14.8333, -64.9000] as [number, number],
    zoom: 13  // Ciudad mediana
  },
  "Cobija": {
    center: [-11.0333, -68.7333] as [number, number],
    zoom: 13  // Ciudad pequeña, zoom más cerrado (-1)
  }
} as const;

export type CityName = keyof typeof CITY_COORDINATES;
