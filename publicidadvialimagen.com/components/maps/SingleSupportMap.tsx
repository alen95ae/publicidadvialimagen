"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function SingleSupportMap({ lat, lng, height = 320 }: { lat: number; lng: number; height?: number }) {
  const [mapId] = useState(() => `singleSupportMap_${Math.random().toString(36).substr(2, 9)}`);

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
      
      // Usar coordenadas directas sin corrección
      map = L.map(mapId, {
        center: [lat, lng],
        zoom: 15,
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

      // icono de valla publicitaria
      const iconBillboard = L.icon({
        iconUrl: "/icons/billboard.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Marcador con coordenadas directas
      const marker = L.marker([lat, lng], {
        icon: iconBillboard,
      }).bindPopup('Soporte Publicitario');
      marker.addTo(map);
    };
    
    initMap();
    
    return () => {
      if ((window as any)[`mapInstance_${mapId}`]) {
        (window as any)[`mapInstance_${mapId}`].remove();
        (window as any)[`mapInstance_${mapId}`] = null;
      }
    };
  }, [lat, lng, mapId]);

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
