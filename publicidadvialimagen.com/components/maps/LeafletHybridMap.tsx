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
  dimensions?: string;
  image?: string;
  monthlyPrice?: number;
  city?: string;
  format?: string;
};

export default function LeafletHybridMap({
  points,
  height = 520,
  center,
  zoom,
}: {
  points: SupportPoint[];
  height?: number;
  center?: [number, number];
  zoom?: number;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapId] = useState(() => `hybridMap_${Math.random().toString(36).substr(2, 9)}`);

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
        if ((window as any).mapInstance) {
          (window as any).mapInstance.invalidateSize();
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
        if ((window as any).mapInstance) {
          (window as any).mapInstance.invalidateSize();
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    let map: L.Map | null = null;
    
    // Esperar a que el DOM esté listo
    const initMap = () => {
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) {
        console.log(`Map container not found for ID: ${mapId}`);
        setTimeout(initMap, 100);
        return;
      }
      
      // Verificar que el contenedor tenga dimensiones
      if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        console.log(`Map container has no dimensions, retrying...`);
        setTimeout(initMap, 100);
        return;
      }
      
      console.log(`Initializing map with ID: ${mapId}, points:`, points);
      
      // Limpiar mapa anterior si existe
      if ((window as any).mapInstance) {
        try {
          (window as any).mapInstance.remove();
        } catch (error) {
          console.log('Error removing previous map:', error);
        }
        (window as any).mapInstance = null;
      }
      
      // Usar centro y zoom específicos si se proporcionan, sino usar valores por defecto
      let defaultCenter, defaultZoom;
      
      if (center && zoom) {
        // Usar los valores proporcionados
        defaultCenter = center;
        defaultZoom = zoom;
        console.log(`Using provided center: ${defaultCenter}, zoom: ${defaultZoom}`);
      } else {
        // Valores por defecto basados en los puntos
        defaultCenter = points.length ? [points[0].lat, points[0].lng] : [-16.5000, -68.1500];
        defaultZoom = 6;
        console.log(`Using default center: ${defaultCenter}, zoom: ${defaultZoom}`);
      }

      console.log(`Creating map with center: ${defaultCenter}, zoom: ${defaultZoom}`);
      
      map = L.map(mapId, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });

      console.log(`Map created successfully for ID: ${mapId}`);

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
          z-index: 1000;
        `;
        
        const updateButton = () => {
          // Verificar el estado actual del mapa
          const mapContainer = document.getElementById(mapId);
          const isCurrentlyFullscreen = mapContainer && mapContainer.style.position === 'fixed';
          
          button.title = isCurrentlyFullscreen ? "Salir de pantalla completa" : "Pantalla completa";
          button.innerHTML = isCurrentlyFullscreen ? '✕' : '⤢';
        };
        
        // Función para manejar el clic
        const handleClick = () => {
          toggleFullscreen();
          // Actualizar el botón después del cambio
          setTimeout(() => {
            updateButton();
          }, 200);
        };
        
        button.onclick = handleClick;
        
        // Actualizar el botón inicialmente
        updateButton();
        
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
      
      // Crear icono building-2 personalizado con Lucide
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

      // marcadores
      const bounds = L.latLngBounds([]);
      console.log(`Adding ${points.length} markers to map`);
      points.forEach((p, index) => {
        console.log(`Adding marker ${index + 1}:`, p);
        
        // Crear popup con información completa
        const popupContent = `
          <div style="min-width: 160px; max-width: 180px;">
            <div style="margin-bottom: 4px;">
              <a href="/vallas-publicitarias/${p.id}" 
                 style="color: #dc2626; text-decoration: none; font-size: 12px; font-weight: 600; display: block;"
                 onmouseover="this.style.textDecoration='underline'" 
                 onmouseout="this.style.textDecoration='none'">
                ${p.title || 'Soporte Publicitario'}
              </a>
            </div>
            ${p.dimensions || p.format || p.image ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 2px; justify-content: center;">
                  ${p.dimensions ? `
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #6b7280;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/>
                        <path d="m14.5 12.5 2-2"/>
                        <path d="m11.5 9.5 2-2"/>
                        <path d="m8.5 6.5 2-2"/>
                        <path d="m17.5 15.5 2-2"/>
                      </svg>
                      <span>${p.dimensions}</span>
                    </div>
                  ` : ''}
                  ${p.format ? `
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #6b7280;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                        <rect width="20" height="14" x="2" y="3" rx="2"/>
                        <line x1="8" x2="16" y1="21" y2="21"/>
                        <line x1="12" x2="12" y1="17" y2="21"/>
                      </svg>
                      <span>${p.format}</span>
                    </div>
                  ` : ''}
                </div>
                ${p.image ? `
                  <div style="flex-shrink: 0;">
                    <img src="${p.image}" 
                         alt="${p.title || 'Soporte'}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;" />
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `;
        
        const marker = L.marker([p.lat, p.lng], {
          icon: p.type === "building" ? iconBuilding : iconBillboard,
        }).bindPopup(popupContent);
        marker.addTo(map);
        bounds.extend([p.lat, p.lng]);
        console.log(`Marker ${index + 1} added successfully`);
      });

      // Solo hacer fitBounds si hay múltiples puntos y no se proporcionaron center y zoom específicos
      if (points.length > 1 && !center && !zoom) {
        console.log("Fitting bounds for multiple points");
        map.fitBounds(bounds);
      } else if (points.length === 1 && !center && !zoom) {
        // Para un solo punto, centrar en ese punto con zoom apropiado
        console.log("Setting view for single point");
        map.setView([points[0].lat, points[0].lng], 15);
      } else {
        console.log("Using provided center and zoom, no fitBounds needed");
      }

      // guardar vista actual al mover o hacer zoom (solo si no se proporcionaron center y zoom)
      if (!center && !zoom) {
        map.on("moveend zoomend", () => {
          if (typeof window !== 'undefined') {
            const center = map.getCenter();
            const zoom = map.getZoom();
            localStorage.setItem(
              `map_state_${mapId}`,
              JSON.stringify({
                center: [center.lat, center.lng],
                zoom,
              })
            );
          }
        });
      }

      // listener para la tecla Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullscreen) {
          toggleFullscreen();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
    };
    
    // Inicializar el mapa
    initMap();
    
    return () => {
      // Limpiar el mapa si existe
      if ((window as any).mapInstance) {
        (window as any).mapInstance.remove();
        (window as any).mapInstance = null;
      }
      document.removeEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isFullscreen) {
          toggleFullscreen();
        }
      });
    };
  }, [points, center, zoom, mapId]);

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
