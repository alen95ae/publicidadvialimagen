"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Map, EyeOff, Maximize2, Minimize2 } from "lucide-react"

// Dynamic import of the entire map component to avoid SSR issues
const DynamicMap = dynamic(
  () => import("./dynamic-map"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    )
  }
)

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

interface BillboardMapProps {
  billboards: BillboardLocation[]
  selectedCity?: string
  isVisible: boolean
  onToggle: () => void
}

export default function BillboardMap({ billboards, selectedCity, isVisible, onToggle }: BillboardMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className="w-full">
      {isVisible && (
        <div className={`mb-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-[1000] flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-2 bg-white shadow-lg"
              >
                <Minimize2 className="h-4 w-4" />
                Salir de Pantalla Completa
              </Button>
            </div>
          )}
          <div className={isFullscreen ? 'h-screen' : ''}>
            <DynamicMap 
              billboards={billboards} 
              selectedCity={selectedCity}
              isFullscreen={isFullscreen}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="flex items-center gap-2"
        >
          {isVisible ? (
            <>
              <EyeOff className="h-4 w-4" />
              Ocultar Mapa
            </>
          ) : (
            <>
              <Map className="h-4 w-4" />
              Mostrar Mapa
            </>
          )}
        </Button>
        
        {isVisible && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-2"
          >
            <Maximize2 className="h-4 w-4" />
            Pantalla Completa
          </Button>
        )}
      </div>
    </div>
  )
}
