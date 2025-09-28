"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Importar Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Componente dinámico para evitar problemas de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false })

// Componente para actualizar el centro del mapa
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, 15)
    }
  }, [map, center])
  
  return null
}

interface SupportMapProps {
  googleMapsLink?: string | null
  latitude?: number | null
  longitude?: number | null
  title?: string
  code?: string
  className?: string
}

// Función para extraer coordenadas de Google Maps link
function extractCoordinatesFromGoogleMaps(link: string): [number, number] | null {
  try {
    // Patrones comunes de Google Maps
    const patterns = [
      // @lat,lng
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // !3d-lat!4d-lng
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      // ll=lat,lng
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // center=lat,lng
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    ]

    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!isNaN(lat) && !isNaN(lng)) {
          return [lat, lng]
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// Icono personalizado para valla publicitaria
function createBillboardIcon() {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  
  // Configurar iconos por defecto de Leaflet (soluciona problema de iconos faltantes)
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
  
  // Usar exactamente el mismo SVG que en la web (billboard-icon.tsx)
  const iconSize = [25, 25]
  const svgContent = `
    <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <!-- Billboard sign -->
      <rect x="2" y="2" width="21" height="12" rx="2" fill="#dc2626" stroke="white" stroke-width="2" filter="url(#shadow)"/>
      <!-- Support post -->
      <rect x="11" y="14" width="3" height="8" fill="#dc2626" stroke="white" stroke-width="1" filter="url(#shadow)"/>
    </svg>
  `
  
  return L.divIcon({
    html: svgContent,
    className: 'custom-billboard-icon',
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]]
  })
}

// Función para crear icono por defecto si falla el personalizado
function createDefaultIcon() {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  
  return new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

export default function SupportMap({ googleMapsLink, latitude, longitude, title, code, className = "" }: SupportMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Priorizar coordenadas directas sobre Google Maps link
    if (latitude && longitude) {
      setCoordinates([latitude, longitude])
    } else if (googleMapsLink) {
      const coords = extractCoordinatesFromGoogleMaps(googleMapsLink)
      setCoordinates(coords)
    } else {
      setCoordinates(null)
    }
  }, [latitude, longitude, googleMapsLink])

  if (!isClient || !coordinates) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📍</div>
          <p>Ubicación no disponible</p>
          {googleMapsLink && (
            <a 
              href={googleMapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2 block"
            >
              Ver en Google Maps
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      <MapContainer
        center={coordinates}
        zoom={15}
        style={{ height: '300px', width: '100%' }}
        scrollWheelZoom={true}
        key={`${coordinates[0]}-${coordinates[1]}`} // Forzar re-render cuando cambien las coordenadas
      >
        <MapUpdater center={coordinates} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={coordinates} 
          icon={createBillboardIcon() || createDefaultIcon()}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg">{title}</h3>
              <p className="text-sm text-gray-600">Código: {code}</p>
              {googleMapsLink && (
                <a 
                  href={googleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Ver en Google Maps
                </a>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
