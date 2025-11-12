"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { createBillboardIcon } from "./billboard-icon"
import { getBillboardUrl } from "@/lib/url-utils"

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
  locale?: 'es' | 'en'
}

// Componente interno para controlar el z-index del mapa
function MapZIndexController({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (!isFullscreen) {
      // Asegurar que el contenedor del mapa tenga z-index bajo
      const mapContainer = map.getContainer()
      if (mapContainer) {
        mapContainer.style.zIndex = '0'
        
        // Resetear z-index de todos los panes de Leaflet
        const panes = map.getPanes()
        Object.values(panes).forEach((pane) => {
          if (pane instanceof HTMLElement) {
            const zIndex = parseInt(pane.style.zIndex || '0')
            if (zIndex > 50) {
              pane.style.zIndex = ''
            }
          }
        })
      }
    }
  }, [map, isFullscreen])
  
  return null
}

export default function DynamicMap({ billboards, selectedCity, isFullscreen = false, zoom, locale = 'es' }: DynamicMapProps) {
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
    <div className={`${isFullscreen ? 'h-screen' : 'h-96'} rounded-lg overflow-hidden border relative`} style={{ zIndex: isFullscreen ? 0 : 0 }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
        className="z-0"
      >
        <MapZIndexController isFullscreen={isFullscreen} />
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
                    href={getBillboardUrl(billboard.name, locale)}
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
                          <Image 
                            src={billboard.images[0]} 
                            alt={billboard.name}
                            fill
                            className="object-cover rounded"
                            sizes="125px"
                            loading="lazy"
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
