'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para los iconos de Leaflet en producción
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface InteractiveMapProps {
  lat: number
  lng: number
  editable?: boolean
  height?: string
  zoom?: number
  markers?: Array<{ position: [number, number], label?: string }>
  onClick?: (lat: number, lng: number) => void
}

export default function InteractiveMap({
  lat,
  lng,
  editable = false,
  height = '400px',
  zoom = 13,
  markers = [],
  onClick
}: InteractiveMapProps) {
  const center: [number, number] = [lat, lng]

  useEffect(() => {
    // Asegurar que Leaflet se inicialice correctamente
    if (typeof window !== 'undefined') {
      // Verificar que el contenedor del mapa tenga dimensiones
      const mapContainer = document.querySelector('.leaflet-container')
      if (mapContainer) {
        const rect = mapContainer.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          console.warn('Map container has no dimensions')
        }
      }
    }
  }, [])

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="📖 OSM">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="🌍 Satélite">
            <TileLayer
              attribution="© Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Marcador principal (coordenadas directas) */}
        <Marker position={center}>
          <Popup>
            Ubicación seleccionada<br />
            Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
          </Popup>
        </Marker>
        
        {/* Marcadores adicionales si se proporcionan */}
        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position}>
            {marker.label && <Popup>{marker.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
