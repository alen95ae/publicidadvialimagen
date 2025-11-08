"use client"

import { useState, useEffect } from "react"
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
  const [mapKey, setMapKey] = useState(0)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Asegurar que el body no tenga overflow hidden cuando se sale del modo completo
  // y limpiar los popups de Leaflet cuando se sale del modo completo
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      
      // Cerrar todos los popups de Leaflet y resetear z-index
      setTimeout(() => {
        // Buscar y cerrar todos los popups de Leaflet
        const popups = document.querySelectorAll('.leaflet-popup')
        popups.forEach((popup) => {
          const closeButton = popup.querySelector('.leaflet-popup-close-button')
          if (closeButton) {
            ;(closeButton as HTMLElement).click()
          }
        })
        
        // Resetear z-index de los controles de Leaflet
        const leafletControls = document.querySelectorAll('.leaflet-control-container')
        leafletControls.forEach((control) => {
          const element = control as HTMLElement
          if (element.style.zIndex) {
            element.style.zIndex = ''
          }
        })
        
        // Resetear z-index de los panes de Leaflet
        const leafletPanes = document.querySelectorAll('.leaflet-pane')
        leafletPanes.forEach((pane) => {
          const element = pane as HTMLElement
          if (parseInt(element.style.zIndex || '0') > 50) {
            element.style.zIndex = ''
          }
        })
      }, 100)
      
      // Forzar re-render del mapa para limpiar estados
      setMapKey(prev => prev + 1)
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  return (
    <div className="w-full">
      {isVisible && (
        <div 
          className={`mb-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}
          style={!isFullscreen ? { 
            isolation: 'isolate',
            zIndex: 0,
            position: 'relative'
          } : undefined}
        >
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
              key={mapKey}
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
