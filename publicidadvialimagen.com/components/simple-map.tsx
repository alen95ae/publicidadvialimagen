"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { useMemo } from "react"
import { createBillboardIcon } from "./billboard-icon"

type LatLngTuple = [number, number]

export interface SimpleMapProps {
  center: LatLngTuple
  zoom?: number
  heightClassName?: string
  markerLabel?: string
  markerTitle?: string
  markerSubtitle?: string
  markerLinkUrl?: string
  markerLinkLabel?: string
}

export default function SimpleMap({ center, zoom = 16, heightClassName = "h-96", markerLabel, markerTitle, markerSubtitle, markerLinkUrl, markerLinkLabel = "Abrir en Google Maps" }: SimpleMapProps) {
  // Billboard icon matching site brand
  const icon = useMemo(() => createBillboardIcon(), [])

  return (
    <div className={`${heightClassName} rounded-lg overflow-hidden shadow-lg border`}> 
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={icon}>
          <Popup>
            {markerTitle ? <h3 className="font-semibold text-sm mb-1">{markerTitle}</h3> : null}
            {markerSubtitle ? <p className="text-xs text-muted-foreground mb-2">{markerSubtitle}</p> : null}
            {markerLinkUrl ? (
              <a
                href={markerLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline"
              >
                {markerLinkLabel}
              </a>
            ) : markerLabel ? (
              <div className="text-sm">{markerLabel}</div>
            ) : null}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}


