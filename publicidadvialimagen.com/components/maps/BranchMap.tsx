"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { correctCoordsForOSM } from "@/lib/mapUtils";

export default function BranchMap({ lat, lng, label, height = 260 }: { lat: number; lng: number; label?: string; height?: number }) {
  const [mapId] = useState(() => `branchMap_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let map: L.Map | null = null;
    
    const initMap = () => {
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) {
        setTimeout(initMap, 100);
        return;
      }
      
      // Limpiar mapa anterior si existe
      if ((window as any)[`mapInstance_${mapId}`]) {
        (window as any)[`mapInstance_${mapId}`].remove();
        (window as any)[`mapInstance_${mapId}`] = null;
      }
      
      // Aplicar corrección para OSM (capa por defecto)
      const correctedCoords = correctCoordsForOSM(lat, lng)
      map = L.map(mapId, {
        center: [correctedCoords.lat, correctedCoords.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      // Guardar la instancia del mapa
      (window as any)[`mapInstance_${mapId}`] = map;

      // capas base
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { 
          maxZoom: 19, 
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' 
        }
      );
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "© Esri" }
      );

      // capa por defecto (OSM)
      osm.addTo(map);

      // selector de capas
      const baseLayers = {
        "📖 OSM": osm,
        "🌍 Satélite": esriSatellite,
      };
      L.control.layers(baseLayers).addTo(map);

      // icono de edificio
      const iconBuilding = L.divIcon({
        className: 'custom-building-icon',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: #dc2626; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-2"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Detectar capa activa y ajustar coordenadas
      let isOSMActive = true // OSM es la capa por defecto
      
      // Escuchar cambios de capa
      map.on('baselayerchange', (e: any) => {
        isOSMActive = e.name === "📖 OSM"
        const displayCoords = isOSMActive ? correctCoordsForOSM(lat, lng) : { lat, lng }
        marker.setLatLng([displayCoords.lat, displayCoords.lng])
        map.setView([displayCoords.lat, displayCoords.lng], map.getZoom())
      })

      // marcador (con corrección para OSM inicial)
      const displayCoords = isOSMActive ? correctCoordsForOSM(lat, lng) : { lat, lng }
      const marker = L.marker([displayCoords.lat, displayCoords.lng], {
        icon: iconBuilding,
      }).bindPopup(label || 'Sucursal');
      marker.addTo(map);
    };
    
    initMap();
    
    return () => {
      if ((window as any)[`mapInstance_${mapId}`]) {
        (window as any)[`mapInstance_${mapId}`].remove();
        (window as any)[`mapInstance_${mapId}`] = null;
      }
    };
  }, [lat, lng, label, mapId]);

  return (
    <div
      id={mapId}
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}
    />
  );
}
