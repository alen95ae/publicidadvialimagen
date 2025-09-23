"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Map, EyeOff } from "lucide-react"

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
  id: number
  name: string
  location: string
  city: string
  monthlyPrice: number
  coordinates: [number, number] // [lat, lng]
}

interface BillboardMapProps {
  billboards: BillboardLocation[]
  selectedCity?: string
  isVisible: boolean
  onToggle: () => void
}

export default function BillboardMap({ billboards, selectedCity, isVisible, onToggle }: BillboardMapProps) {

  return (
    <div className="w-full">
      {isVisible && (
        <div className="mb-4">
          <DynamicMap 
            billboards={billboards} 
            selectedCity={selectedCity}
          />
        </div>
      )}
      
      <div className="flex justify-center">
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
      </div>
    </div>
  )
}
