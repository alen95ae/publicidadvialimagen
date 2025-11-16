"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createSlug } from '@/lib/url-utils';

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
  locale = 'es',
}: {
  points: SupportPoint[];
  height?: number;
  center?: [number, number];
  zoom?: number;
  locale?: 'es' | 'en';
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapId] = useState(() => `hybridMap_${Math.random().toString(36).substr(2, 9)}`);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const isInitializedRef = useRef(false);
  const currentLayerRef = useRef<string>("📖 OSM"); // Track current layer

  // Función para añadir marcadores al mapa (memoizada para evitar re-creaciones)
  const addMarkersToMap = useCallback((map: L.Map, preserveZoom: boolean = false) => {
    if (!points || points.length === 0) return;
    
    // Preservar zoom y centro actuales si se solicita
    const currentZoom = preserveZoom ? map.getZoom() : undefined;
    const currentCenter = preserveZoom ? map.getCenter() : undefined;
    
    // Limpiar marcadores existentes
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    
    // Detectar si OSM está activa usando la referencia actual
    const useOSM = currentLayerRef.current === "📖 OSM"
    
    // Añadir nuevos marcadores
    const iconBillboard = L.icon({
      iconUrl: "/icons/billboard.svg",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    
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
    
    const bounds = L.latLngBounds([]);
    points.forEach((p) => {
      // Usar coordenadas directas sin corrección
      const displayCoords = { lat: p.lat, lng: p.lng }
      
      const slug = createSlug(p.title || 'Soporte Publicitario')
      // El sistema de i18n funciona con contexto, no con rutas separadas
      const basePath = '/vallas-publicitarias'
      const popupContent = `
        <div style="min-width: 160px; max-width: 180px;">
          <div style="margin-bottom: 4px;">
            <a href="${basePath}/${slug}" 
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
      
      const marker = L.marker([displayCoords.lat, displayCoords.lng], {
        icon: p.type === "building" ? iconBuilding : iconBillboard,
      }).bindPopup(popupContent);
      marker.addTo(map);
      bounds.extend([displayCoords.lat, displayCoords.lng]);
    });
    
    // Ajustar vista si hay puntos (solo si no se debe preservar el zoom)
    if (points.length > 0 && !preserveZoom) {
      if (points.length > 1 && !center && !zoom) {
        map.fitBounds(bounds);
      } else if (points.length === 1 && !center && !zoom) {
        const firstPoint = points[0]
        const displayCoords = { lat: firstPoint.lat, lng: firstPoint.lng }
        map.setView([displayCoords.lat, displayCoords.lng], 15);
      }
    } else if (preserveZoom && currentZoom && currentCenter) {
      // Preservar zoom y centro, solo actualizar marcadores
      // No hacer nada, los marcadores ya están añadidos
    }
  }, [points, center, zoom, locale]);

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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    } else {
      // Salir de pantalla completa del mapa
      mapContainer.style.position = 'relative';
      mapContainer.style.top = 'auto';
      mapContainer.style.left = 'auto';
      mapContainer.style.width = '100%';
      mapContainer.style.height = height + 'px';
      // Asegurar que el contenedor vuelve a un z-index bajo dentro de su propio contexto
      mapContainer.style.zIndex = '0';
      mapContainer.style.backgroundColor = 'transparent';
      setIsFullscreen(false);
      
      // Redimensionar el mapa
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Evitar inicialización múltiple
    if (isInitializedRef.current) {
      return;
    }
    
    let map: L.Map | null = null;
    
    // Esperar a que el DOM esté listo
    const initMap = () => {
      const mapContainer = document.getElementById(mapId);
      if (!mapContainer) {
        setTimeout(initMap, 100);
        return;
      }
      
      // Verificar que el contenedor tenga dimensiones
      if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
        setTimeout(initMap, 100);
        return;
      }
      
      // Si ya está inicializado, no hacer nada
      if (isInitializedRef.current && mapInstanceRef.current) {
        return;
      }
      
      // Limpiar mapa anterior si existe
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.log('Error removing previous map:', error);
        }
        mapInstanceRef.current = null;
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

      map = L.map(mapId, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      // Guardar la instancia del mapa en el ref
      mapInstanceRef.current = map;
      isInitializedRef.current = true;
      
      // Añadir marcadores después de inicializar el mapa
      addMarkersToMap(map);

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
      const layersControl = L.control.layers(baseLayers);
      layersControl.addTo(map);
      
      // Escuchar cambios de capa y actualizar marcadores preservando el zoom
      map.on('baselayerchange', (e: any) => {
        // Actualizar la referencia de la capa activa
        currentLayerRef.current = e.name || "📖 OSM";
        
        // Preservar zoom y centro actuales
        const currentZoom = map.getZoom();
        const currentCenter = map.getCenter();
        
        // Actualizar marcadores preservando el zoom
        addMarkersToMap(map, true);
        
        // Asegurar que el zoom y centro se mantengan
        setTimeout(() => {
          if (map.getZoom() !== currentZoom) {
            map.setView([currentCenter.lat, currentCenter.lng], currentZoom);
          }
        }, 50);
      });

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
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    };
    
    // Inicializar el mapa
    const cleanup = initMap();
    
    return () => {
      if (cleanup) cleanup();
      // Limpiar el mapa si existe
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.log('Error removing map on cleanup:', error);
        }
        mapInstanceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [mapId]); // Solo dependemos de mapId que es estable
  
  // Actualizar marcadores cuando cambien los puntos (sin re-inicializar el mapa)
  useEffect(() => {
    if (!mapInstanceRef.current || !isInitializedRef.current) return;
    
    // Si hay center y zoom props específicos, no ajustar automáticamente
    // Esto permite que la vista se ajuste cuando no hay restricciones explícitas
    const shouldAutoFit = !center && !zoom;
    
    // Solo preservar zoom si hay props específicos de center/zoom
    addMarkersToMap(mapInstanceRef.current, !shouldAutoFit);
  }, [addMarkersToMap, center, zoom]); // Actualizar marcadores cuando cambien los puntos, center o zoom

  // Gestionar el overflow del body al entrar/salir de pantalla completa
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isFullscreen]);

  return (
    <div
      id={mapId}
      style={{
        width: "100%",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        position: "relative",
        // Crear un nuevo contexto de apilamiento para que los z-index internos de Leaflet
        // no superpongan al header. Mantener un z-index bajo fuera de fullscreen.
        zIndex: 0,
        isolation: "isolate",
      }}
    />
  );
}
