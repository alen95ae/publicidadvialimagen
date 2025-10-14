"use client"

import Link from "next/link"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { createBillboardIcon } from "./billboard-icon"

interface BillboardLocation {
  id: string | number
  name: string
  location: string
  city: string
  monthlyPrice: number
  format?: string
  dimensions?: string
  images?: string[]
  coordinates?: {
    lat: number
    lng: number
  } | [number, number] // Soportar ambos formatos
}

interface DynamicMapProps {
  billboards: BillboardLocation[]
  selectedCity?: string
  isFullscreen?: boolean
  zoom?: number
}

export default function DynamicMap({ billboards, selectedCity, isFullscreen = false, zoom }: DynamicMapProps) {
  // Coordinates for Bolivia cities (approximate centers)
  const cityCoordinates: Record<string, [number, number]> = {
    "La Paz": [-16.5000, -68.1500],
    "Santa Cruz": [-17.7833, -63.1833],
    "Cochabamba": [-17.3833, -66.1667],
    "El Alto": [-16.5167, -68.1833],
    "Sucre": [-19.0500, -65.2500],
    "Potosi": [-19.5833, -65.7500],
    "Potosí": [-19.5833, -65.7500],
    "Tarija": [-21.5333, -64.7333],
    "Oruro": [-17.9833, -67.1500],
    "Beni": [-14.8333, -64.9000],
    "Trinidad": [-14.8333, -64.9000],
    "Cobija": [-11.0267, -68.7692],
  }

  // Default center (Centro de Bolivia para vista completa)
  const defaultCenter: [number, number] = [-16.5000, -64.0000]
  
  // Filter billboards by selected city or show all
  // Los billboards ya vienen filtrados desde el componente padre
  const filteredBillboards = billboards

  // Set map center based on selected city or billboard location
  let mapCenter = defaultCenter
  let mapZoom = zoom || (selectedCity ? 12 : 5)
  
  if (selectedCity && cityCoordinates[selectedCity]) {
    mapCenter = cityCoordinates[selectedCity]
  } else if (billboards.length > 0 && billboards[0].coordinates) {
    // Use the first billboard's coordinates as center
    const coords = billboards[0].coordinates
    if (Array.isArray(coords)) {
      mapCenter = coords
    } else if (coords.lat && coords.lng) {
      mapCenter = [coords.lat, coords.lng]
    }
    // Higher zoom for individual billboard pages
    if (!selectedCity && billboards.length === 1) {
      mapZoom = zoom || 16
    }
  }

  return (
    <div className={`${isFullscreen ? 'h-screen' : 'h-96'} rounded-lg overflow-hidden border`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {filteredBillboards.map((billboard) => {
          // Normalizar coordenadas
          let position: [number, number] | null = null
          
          if (billboard.coordinates) {
            if (Array.isArray(billboard.coordinates)) {
              position = billboard.coordinates
            } else if (billboard.coordinates.lat && billboard.coordinates.lng) {
              position = [billboard.coordinates.lat, billboard.coordinates.lng]
            }
          }
          
          // Solo renderizar si tenemos coordenadas válidas
          if (!position || isNaN(position[0]) || isNaN(position[1])) {
            return null
          }
          
          return (
            <Marker 
              key={billboard.id} 
              position={position}
              icon={createBillboardIcon()}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <Link 
                    href={`/vallas-publicitarias/${billboard.id}`}
                    className="font-semibold text-sm mb-2 text-primary hover:underline block"
                  >
                    {billboard.name}
                  </Link>
                  
                  <div className="flex gap-2">
                    {/* Campos de información - mitad izquierda */}
                    <div className="flex-1">
                      {/* Tipo de soporte */}
                      {billboard.format && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Tipo:</span> {billboard.format}
                        </p>
                      )}
                      
                      {/* Dimensiones */}
                      {billboard.dimensions && (
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-medium">Dimensiones:</span> {billboard.dimensions}
                        </p>
                      )}
                    </div>
                    
                    {/* Imagen del soporte - mitad derecha */}
                    {billboard.images && billboard.images.length > 0 && (
                      <div className="flex-1">
                        <div className="relative w-full" style={{ aspectRatio: '222/147' }}>
                          <img 
                            src={billboard.images[0]} 
                            alt={billboard.name}
                            className="absolute inset-0 w-full h-full object-cover rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
