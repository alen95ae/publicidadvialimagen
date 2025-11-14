"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { correctCoordsForOSM } from "@/lib/mapUtils";

export default function ContactMap({
  lat,
  lng,
  title,
  height = 300,
}: {
  lat: number;
  lng: number;
  title: string;
  height?: number;
}) {
  const [mapId] = useState(() => `contactMap_${Math.random().toString(36).substr(2, 9)}`);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return;
    
    const isCurrentlyFullscreen = mapContainer.style.position === 'fixed';
    
    if (!isCurrentlyFullscreen) {
      // Entrar a pantalla completa del mapa
      mapContainer.style.position = 'fixed';
      mapContainer.style.top = '0';
      mapContainer.style.left = '0';
      mapContainer.style.width = '100vw';
      mapContainer.style.height = '100vh';
      mapContainer.style.zIndex = '40';
      mapContainer.style.backgroundColor = 'white';
      setIsFullscreen(true);
      
      // Redimensionar el mapa
      setTimeout(() => {
        if ((window as any)[`mapInstance_${mapId}`]) {
          (window as any)[`mapInstance_${mapId}`].invalidateSize();
        }
      }, 100);
    } else {
      // Salir de pantalla completa del mapa
      mapContainer.style.position = 'relative';
      mapContainer.style.top = 'auto';
      mapContainer.style.left = 'auto';
      mapContainer.style.width = '100%';
      mapContainer.style.height = height + 'px';
      mapContainer.style.zIndex = 'auto';
      mapContainer.style.backgroundColor = 'transparent';
      setIsFullscreen(false);
      
      // Redimensionar el mapa
      setTimeout(() => {
        if ((window as any)[`mapInstance_${mapId}`]) {
          (window as any)[`mapInstance_${mapId}`].invalidateSize();
        }
      }, 100);
    }
  };

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

      // botón de pantalla completa
      const fullscreenButton = L.control({ position: 'topright' });
      fullscreenButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        const button = L.DomUtil.create('button', 'fullscreen-btn');
        button.style.cssText = `
          background: white; 
          border: 2px solid rgba(0,0,0,0.2); 
          border-radius: 4px; 
          width: 40px; 
          height: 40px; 
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          z-index: 1000;
        `;
        
        const updateButton = () => {
          const mapContainer = document.getElementById(mapId);
          const isCurrentlyFullscreen = mapContainer && mapContainer.style.position === 'fixed';
          
          button.title = isCurrentlyFullscreen ? "Salir de pantalla completa" : "Pantalla completa";
          button.innerHTML = isCurrentlyFullscreen ? '✕' : '⤢';
        };
        
        const handleClick = () => {
          toggleFullscreen();
          setTimeout(() => {
            updateButton();
          }, 200);
        };
        
        button.onclick = handleClick;
        updateButton();
        div.appendChild(button);
        
        return div;
      };
      fullscreenButton.addTo(map);

      // icono building-2 personalizado
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
      }).bindPopup(title);
      marker.addTo(map);

      // listener para la tecla Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullscreen) {
          toggleFullscreen();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
    };
    
    initMap();
    
    return () => {
      if ((window as any)[`mapInstance_${mapId}`]) {
        (window as any)[`mapInstance_${mapId}`].remove();
        (window as any)[`mapInstance_${mapId}`] = null;
      }
      document.removeEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullscreen) {
          toggleFullscreen();
        }
      });
    };
  }, [lat, lng, title, mapId, isFullscreen]);

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
