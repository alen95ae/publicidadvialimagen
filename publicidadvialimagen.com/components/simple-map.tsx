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

// Función para crear icono de edificio para sucursales
const createBuildingIcon = () => {
  return L.divIcon({
    className: 'custom-building-icon',
    html: `
      <div style="
        background-color: #be1818;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 20" width="20" height="20">
          <defs>
            <style>
              .cls-1{fill:#be1818;}
              .cls-2{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}
            </style>
          </defs>
          <rect class="cls-1" x="1.53" y="8.23" width="19.24" height="10.21"/>
          <rect class="cls-1" x="5.58" y="1.6" width="11.08" height="9.37"/>
          <rect class="cls-1" x="15.12" y="5" width="5" height="5"/>
          <path class="cls-2" d="M10,12h4" transform="translate(-1 -2)"/>
          <path class="cls-2" d="M10,8h4" transform="translate(-1 -2)"/>
          <path class="cls-2" d="M14,21V18a2,2,0,0,0-4,0v3" transform="translate(-1 -2)"/>
          <path class="cls-2" d="M6,10H4a2,2,0,0,0-2,2v7a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V9a2,2,0,0,0-2-2H18" transform="translate(-1 -2)"/>
          <path class="cls-2" d="M6,21V5A2,2,0,0,1,8,3h8a2,2,0,0,1,2,2V21" transform="translate(-1 -2)"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

export default function SimpleMap({ center, zoom = 16, heightClassName = "h-96", markerLabel, markerTitle, markerSubtitle, markerLinkUrl, markerLinkLabel = "Abrir en OpenStreetMap" }: SimpleMapProps) {
  // Usar icono de edificio para sucursales, icono de valla para otros casos
  const icon = useMemo(() => {
    // Si tiene markerTitle y markerSubtitle, es una sucursal
    if (markerTitle && markerSubtitle) {
      return createBuildingIcon()
    }
    return createBillboardIcon()
  }, [markerTitle, markerSubtitle])

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


