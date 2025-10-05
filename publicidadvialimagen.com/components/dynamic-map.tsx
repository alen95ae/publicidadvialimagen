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
  coordinates?: {
    lat: number
    lng: number
  } | [number, number] // Soportar ambos formatos
}

interface DynamicMapProps {
  billboards: BillboardLocation[]
  selectedCity?: string
  isFullscreen?: boolean
}

export default function DynamicMap({ billboards, selectedCity, isFullscreen = false }: DynamicMapProps) {
  // Coordinates for Bolivia cities (approximate centers)
  const cityCoordinates: Record<string, [number, number]> = {
    "La Paz": [-16.5000, -68.1500],
    "Santa Cruz": [-17.7833, -63.1833],
    "Santa Cruz de la Sierra": [-17.7833, -63.1833],
    "Cochabamba": [-17.3833, -66.1667],
    "El Alto": [-16.5167, -68.1833],
    "Sucre": [-19.0500, -65.2500],
    "Potosi": [-19.5833, -65.7500],
    "Potosí": [-19.5833, -65.7500],
    "Tarija": [-21.5333, -64.7333],
    "Oruro": [-17.9833, -67.1500],
    "Beni": [-14.8333, -64.9000],
    "Trinidad": [-14.8333, -64.9000],
  }

  // Default center (La Paz)
  const defaultCenter: [number, number] = [-16.5000, -68.1500]
  
  // Filter billboards by selected city or show all
  // Los billboards ya vienen filtrados desde el componente padre
  const filteredBillboards = billboards

  // Set map center based on selected city
  const mapCenter = selectedCity && cityCoordinates[selectedCity] 
    ? cityCoordinates[selectedCity] 
    : defaultCenter

  return (
    <div className={`${isFullscreen ? 'h-screen' : 'h-96'} rounded-lg overflow-hidden border`}>
      <MapContainer
        center={mapCenter}
        zoom={selectedCity ? 12 : 6}
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
                <div className="p-2">
                  <Link 
                    href={`/billboards/${billboard.id}`}
                    className="font-semibold text-sm mb-1 text-primary hover:underline block"
                  >
                    {billboard.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mb-1">{billboard.location}</p>
                  <p className="text-xs text-muted-foreground mb-2">{billboard.city}</p>
                  <p className="text-sm font-bold text-primary">
                    Bs {billboard.monthlyPrice.toLocaleString()}/mes
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
