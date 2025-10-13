"use client";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type SupportPoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  type?: "billboard" | "building";
};

export default function LeafletHybridMap({
  points,
  height = 520,
}: {
  points: SupportPoint[];
  height?: number;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const mapContainer = document.getElementById('hybridMap');
    if (!isFullscreen) {
      // Entrar a pantalla completa del mapa
      if (mapContainer) {
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '0';
        mapContainer.style.left = '0';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '9999';
        mapContainer.style.backgroundColor = 'white';
        setIsFullscreen(true);
        
        // Redimensionar el mapa
        setTimeout(() => {
          if (window.mapInstance) {
            window.mapInstance.invalidateSize();
          }
        }, 100);
      }
    } else {
      // Salir de pantalla completa del mapa
      if (mapContainer) {
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
          if (window.mapInstance) {
            window.mapInstance.invalidateSize();
          }
        }, 100);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // recuperar posición guardada
    const saved = typeof window !== 'undefined' ? localStorage.getItem("map_state") : null;
    const defaultCenter = saved
      ? JSON.parse(saved).center
      : points.length
      ? [points[0].lat, points[0].lng]
      : [-16.5000, -68.1500]; // Centro de Bolivia
    const defaultZoom = saved ? JSON.parse(saved).zoom : 6;

    const map = L.map("hybridMap", {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: false,
    });

    // Guardar la instancia del mapa globalmente para poder redimensionarla
    (window as any).mapInstance = map;

    // capas base
    const googleMap = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "© Google" }
    );
    const googleSat = L.tileLayer(
      "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      { maxZoom: 20, attribution: "© Google Sat" }
    );
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19, attribution: "© OpenStreetMap" }
    );

    // capa por defecto
    googleMap.addTo(map);

    // selector de capas
    const baseLayers = {
      "🗺️ Mapa": googleMap,
      "🌍 Satélite": googleSat,
      "📖 OSM": osm,
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
      `;
      
      const updateButton = () => {
        // Verificar el estado actual del mapa
        const mapContainer = document.getElementById('hybridMap');
        const isCurrentlyFullscreen = mapContainer && mapContainer.style.position === 'fixed';
        
        button.title = isCurrentlyFullscreen ? "Salir de pantalla completa" : "Pantalla completa";
        button.innerHTML = isCurrentlyFullscreen ? '✕' : '⤢';
      };
      
      updateButton();
      
      button.onclick = () => {
        toggleFullscreen();
        // Actualizar el botón después del cambio
        setTimeout(() => {
          updateButton();
        }, 150);
      };
      
      div.appendChild(button);
      
      return div;
    };
    fullscreenButton.addTo(map);

    // iconos
    const iconBillboard = L.icon({
      iconUrl: "/icons/billboard.svg",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    const iconBuilding = L.icon({
      iconUrl: "/icons/building.svg",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    // marcadores
    const bounds = L.latLngBounds([]);
    points.forEach((p) => {
      const marker = L.marker([p.lat, p.lng], {
        icon: p.type === "building" ? iconBuilding : iconBillboard,
      }).bindPopup(p.title || "");
      marker.addTo(map);
      bounds.extend([p.lat, p.lng]);
    });

    if (points.length > 1) map.fitBounds(bounds);

    // guardar vista actual al mover o hacer zoom
    map.on("moveend zoomend", () => {
      if (typeof window !== 'undefined') {
        const center = map.getCenter();
        const zoom = map.getZoom();
        localStorage.setItem(
          "map_state",
          JSON.stringify({
            center: [center.lat, center.lng],
            zoom,
          })
        );
      }
    });

    // listener para la tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      map.remove();
    };
  }, [points]);

  return (
    <div
      id="hybridMap"
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    />
  );
}
