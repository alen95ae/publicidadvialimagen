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
const useMapEvents = dynamic(() => import('react-leaflet').then(mod => mod.useMapEvents), { ssr: false })
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false })

interface InteractiveMapProps {
  latitude?: number | null
  longitude?: number | null
  onLocationChange?: (lat: number, lng: number) => void
  title?: string
  code?: string
  className?: string
  readOnly?: boolean
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

// Componente para manejar clics en el mapa
function MapClickHandler({ onLocationChange, readOnly }: { onLocationChange?: (lat: number, lng: number) => void, readOnly?: boolean }) {
  const useMapEventsHook = useMapEvents
  useMapEventsHook({
    click: (e: any) => {
      if (!readOnly && onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}


// Componente para chincheta arrastrable
function DraggableMarker({ 
  position, 
  onPositionChange, 
  title, 
  code, 
  readOnly 
}: { 
  position: [number, number]
  onPositionChange?: (lat: number, lng: number) => void
  title?: string
  code?: string
  readOnly?: boolean
}) {
  const [markerPosition, setMarkerPosition] = useState(position)
  
  useEffect(() => {
    console.log('DraggableMarker: position changed to', position)
    setMarkerPosition(position)
  }, [position[0], position[1]])

  const eventHandlers = readOnly ? {} : {
    dragend: (e: any) => {
      const marker = e.target
      const newPosition = marker.getLatLng()
      setMarkerPosition([newPosition.lat, newPosition.lng])
      if (onPositionChange) {
        onPositionChange(newPosition.lat, newPosition.lng)
      }
    },
  }

  // Crear icono con fallback
  const icon = createBillboardIcon() || createDefaultIcon()

  return (
    <Marker
      position={markerPosition}
      draggable={!readOnly}
      eventHandlers={eventHandlers}
      icon={icon}
    >
      <Popup>
        <div className="text-center">
          <h3 className="font-bold text-lg">{title || 'Soporte'}</h3>
          {code && <p className="text-sm text-gray-600">Código: {code}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Lat: {markerPosition[0].toFixed(6)}, Lng: {markerPosition[1].toFixed(6)}
          </p>
          {!readOnly && (
            <p className="text-xs text-blue-600 mt-1">
              Arrastra para mover la ubicación
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export default function InteractiveMap({ 
  latitude, 
  longitude, 
  onLocationChange, 
  title, 
  code, 
  className = "",
  readOnly = false 
}: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  
  // Debug logging
  console.log('InteractiveMap props:', { latitude, longitude, title, code })
  
  // Forzar re-render del mapa cuando cambien las coordenadas
  useEffect(() => {
    console.log('Coordinates changed, forcing map re-render')
    setMapKey(prev => prev + 1)
  }, [latitude, longitude])

  // Agregar estilos CSS para el icono personalizado
  useEffect(() => {
    if (isClient) {
      const style = document.createElement('style')
      style.textContent = `
        .custom-billboard-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .custom-billboard-icon:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .leaflet-marker-draggable .custom-billboard-icon {
          cursor: move;
        }
        .billboard-marker {
          background: transparent !important;
          border: none !important;
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [isClient])
  
  // Coordenadas por defecto (La Paz, Bolivia)
  const defaultCenter: [number, number] = [-16.5000, -68.1500]
  
  // Usar coordenadas proporcionadas o por defecto
  const hasValidCoords = latitude !== null && longitude !== null && !isNaN(latitude!) && !isNaN(longitude!)
  const markerPosition: [number, number] = hasValidCoords 
    ? [latitude!, longitude!] 
    : defaultCenter
  
  console.log('Map coordinates calculation:', {
    latitude,
    longitude,
    hasValidCoords,
    markerPosition,
    defaultCenter
  })
  
  const center: [number, number] = markerPosition
  const hasMarker = true // Siempre mostrar chincheta
  const isDefaultPosition = markerPosition[0] === defaultCenter[0] && markerPosition[1] === defaultCenter[1]

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p>Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`}>
      {!readOnly && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">💡</span>
            <span>Haz clic en el mapa o arrastra la chincheta para seleccionar la ubicación del soporte</span>
          </div>
        </div>
      )}
      
      <MapContainer
        center={center}
        zoom={hasMarker ? 15 : 12}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={true}
        key={mapKey} // Forzar re-render cuando cambien las coordenadas
      >
        <MapClickHandler onLocationChange={onLocationChange} readOnly={readOnly} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <DraggableMarker
          position={markerPosition}
          onPositionChange={onLocationChange}
          title={title}
          code={code}
          readOnly={readOnly}
        />
      </MapContainer>
      
      <div className="bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            {isDefaultPosition 
              ? `Ubicación por defecto: ${markerPosition[0].toFixed(6)}, ${markerPosition[1].toFixed(6)}`
              : `Coordenadas: ${markerPosition[0].toFixed(6)}, ${markerPosition[1].toFixed(6)}`
            }
          </span>
          <a 
            href={`https://www.openstreetmap.org/?mlat=${markerPosition[0]}&mlon=${markerPosition[1]}&zoom=15`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Ver en OpenStreetMap
          </a>
        </div>
        {!readOnly && (
          <div className="mt-1 text-xs text-gray-500">
            {isDefaultPosition 
              ? "Arrastra la chincheta o pega un enlace de Google Maps para establecer la ubicación"
              : "Arrastra la chincheta o haz clic para mover la ubicación"
            }
          </div>
        )}
      </div>
    </div>
  )
}
