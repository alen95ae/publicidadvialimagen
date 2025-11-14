"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type Props = {
  lat: number;
  lng: number;
  onChange: (c: { lat: number; lng: number }) => void;
  height?: number; // px
};

export default function EditableLeafletMap({ lat, lng, onChange, height = 400 }: Props) {
  const [mapId] = useState(() => `editableMap_${Math.random().toString(36).substr(2, 9)}`);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [marker, setMarker] = useState<L.Marker | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const onChangeRef = useRef(onChange);
  const isFullscreenRef = useRef(isFullscreen);

  // Actualizar refs cuando cambian las props
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    const mapContainer = document.getElementById(mapId);
    if (!mapContainer) return;
    
    const isCurrentlyFullscreen = mapContainer.style.position === 'fixed';
    
    if (!isCurrentlyFullscreen) {
      // Entrar a pantalla completa
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
        if (map) {
          map.invalidateSize();
          map.setView([lat, lng], map.getZoom());
        }
      }, 100);
    } else {
      // Salir de pantalla completa
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
        if (map) {
          map.invalidateSize();
          map.setView([lat, lng], map.getZoom());
        }
      }, 100);
    }
  }, [mapId, map, height]);

  // Prevenir scroll del body cuando esté en pantalla completa
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
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
      
      // NO aplicar corrección - usar coordenadas exactas de la base de datos
      const newMap = L.map(mapId, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
        preferCanvas: false,
        renderer: L.svg({ padding: 0.5 })
      });

      // Guardar la instancia del mapa
      (window as any)[`mapInstance_${mapId}`] = newMap;
      setMap(newMap);

      // Capas base
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { 
          maxZoom: 19,
          minZoom: 1,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          updateWhenZooming: false,
          keepBuffer: 2
        }
      );
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { 
          maxZoom: 19,
          minZoom: 1,
          attribution: "© Esri",
          updateWhenZooming: false,
          keepBuffer: 2
        }
      );

      // Capa por defecto (OSM)
      osm.addTo(newMap);

      // Selector de capas (posicionado en topright con margen inferior)
      const baseLayers = {
        "📖 OSM": osm,
        "🌍 Satélite": esriSatellite,
      };
      const layersControl = L.control.layers(baseLayers);
      layersControl.setPosition('topright');
      layersControl.addTo(newMap);
      
      // Ajustar posición del selector de capas para evitar superposición y prevenir propagación de eventos
      setTimeout(() => {
        const layersControlElement = mapContainer.querySelector('.leaflet-control-layers');
        if (layersControlElement) {
          layersControlElement.style.top = '5px'; // Bajar 5px desde arriba
          
          // Prevenir propagación de eventos de click en el selector de capas
          layersControlElement.addEventListener('click', (e) => {
            e.stopPropagation();
          });
          
          // Prevenir propagación en todos los elementos hijos del selector de capas
          const layerElements = layersControlElement.querySelectorAll('*');
          layerElements.forEach(element => {
            element.addEventListener('click', (e) => {
              e.stopPropagation();
            });
          });
        }
      }, 100);

      // Botón de pantalla completa integrado en el mapa (posicionado relativo al selector de capas)
      const fullscreenButton = L.control({ position: 'topright' });
      fullscreenButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.style.backgroundColor = 'white';
        div.style.border = '2px solid rgba(0,0,0,0.2)';
        div.style.borderRadius = '4px';
        div.style.cursor = 'pointer';
        div.style.padding = '4px';
        div.style.fontSize = '16px';
        div.style.fontWeight = '500';
        div.style.width = '28px';
        div.style.height = '28px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.innerHTML = isFullscreenRef.current ? '⤓' : '⤢';
        div.title = isFullscreenRef.current ? 'Salir de pantalla completa' : 'Pantalla completa';
        
        div.onclick = function(e) {
          e.stopPropagation();
          toggleFullscreen();
        };
        
        return div;
      };
      fullscreenButton.addTo(newMap);
      
      // Ajustar posición del botón de pantalla completa para que esté encima del selector de capas
      setTimeout(() => {
        const fullscreenControlElement = mapContainer.querySelector('.leaflet-control-custom');
        if (fullscreenControlElement) {
          fullscreenControlElement.style.top = '0px'; // Posicionado en el borde superior
          
          // Prevenir propagación de eventos en el botón de pantalla completa
          fullscreenControlElement.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      }, 150);

      // Icono de valla publicitaria
      const iconBillboard = L.icon({
        iconUrl: "/icons/billboard.svg",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      // Detectar capa activa
      let isOSMActive = true // OSM es la capa por defecto
      
      // Escuchar cambios de capa - mantener el marcador en el mismo lugar
      newMap.on('baselayerchange', (e: any) => {
        isOSMActive = e.name === "📖 OSM"
        // No mover el marcador ni el mapa cuando cambia la capa
        // Las coordenadas son las mismas para todas las capas
      })

      // Marcador editable (sin corrección - coordenadas exactas)
      const newMarker = L.marker([lat, lng], {
        icon: iconBillboard,
        draggable: true
      }).addTo(newMap);

      setMarker(newMarker);

      // Evento de click en el mapa
      newMap.on('click', (e) => {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        // IMPORTANTE: Guardar exactamente donde el usuario hizo click
        // NO revertir ninguna corrección - las coordenadas son las que el usuario ve
        newMarker.setLatLng([clickedLat, clickedLng]);
        onChangeRef.current({ lat: clickedLat, lng: clickedLng });
        console.log('🎯 Marker moved by click:', { 
          lat: clickedLat, 
          lng: clickedLng,
          isOSM: isOSMActive 
        });
      });

      // Evento de drag del marcador
      newMarker.on('dragend', (e) => {
        const { lat: draggedLat, lng: draggedLng } = e.target.getLatLng();
        // IMPORTANTE: Guardar exactamente donde quedó el marcador
        // NO revertir ninguna corrección - las coordenadas son las que el usuario ve
        onChangeRef.current({ lat: draggedLat, lng: draggedLng });
        console.log('🎯 Marker drag ended:', { 
          lat: draggedLat, 
          lng: draggedLng,
          isOSM: isOSMActive 
        });
      });

      // Evento de zoom para redimensionar correctamente
      newMap.on('zoomend', () => {
        setTimeout(() => {
          newMap.invalidateSize();
        }, 50);
      });
    };

    initMap();

    // Cleanup
    return () => {
      if ((window as any)[`mapInstance_${mapId}`]) {
        (window as any)[`mapInstance_${mapId}`].remove();
        (window as any)[`mapInstance_${mapId}`] = null;
      }
    };
  }, [mapId]); // Solo dependencia del mapId

  // Actualizar posición del marcador cuando cambian las props
  useEffect(() => {
    if (marker && map) {
      // Detectar capa activa
      // NO aplicar corrección - usar coordenadas exactas de la base de datos
      const currentPos = marker.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.000001 || Math.abs(currentPos.lng - lng) > 0.000001) {
        console.log('📍 Updating marker position:', { lat, lng });
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], map.getZoom());
      }
    }
  }, [lat, lng, marker, map]);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''}`}>
      <div 
        id={mapId} 
        style={{ 
          height: isFullscreen ? '100vh' : height, 
          width: '100%',
          borderRadius: isFullscreen ? 0 : 12
        }}
        className="border border-gray-200"
      />
    </div>
  );
}
