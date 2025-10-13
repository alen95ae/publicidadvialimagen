"use client";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import GoogleMapsLoader from "./GoogleMapsLoader";

type Props = {
  lat: number;
  lng: number;
  onChange: (c: { lat: number; lng: number }) => void;
  height?: number; // px
};

export default function EditableSupportMap({ lat, lng, onChange, height = 400 }: Props) {
  const [pos, setPos] = useState({ lat, lng });
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const center = useMemo(() => ({ lat: pos.lat, lng: pos.lng }), [pos]);
  const mapContainerStyle = useMemo(() => ({ 
    width: "100%", 
    height: isFullscreen ? "100vh" : height, 
    borderRadius: isFullscreen ? 0 : 12,
    position: isFullscreen ? "fixed" : "relative",
    top: isFullscreen ? 0 : "auto",
    left: isFullscreen ? 0 : "auto",
    zIndex: isFullscreen ? 9999 : "auto"
  }), [height, isFullscreen]);

  // Verificar que Google Maps esté cargado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      setGoogleLoaded(true);
    }
  }, []);

  // Actualizar posición cuando cambian las props
  useEffect(() => {
    if (lat !== pos.lat || lng !== pos.lng) {
      console.log('📍 Updating marker position:', { lat, lng });
      setPos({ lat, lng });
    }
  }, [lat, lng, pos.lat, pos.lng]);

  const onClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat(); const lng = e.latLng?.lng();
    if (lat && lng) { 
      setPos({ lat, lng }); 
      onChange({ lat, lng }); 
      console.log('🎯 Marker moved by click:', { lat, lng });
    }
  }, [onChange]);

  const onDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat(); const lng = e.latLng?.lng();
    if (lat && lng) { 
      console.log('🎯 Marker drag ended, calling onChange with:', { lat, lng });
      setPos({ lat, lng }); 
      onChange({ lat, lng }); 
      console.log('✅ onChange called successfully');
    }
  }, [onChange]);

  // Crear icono de forma segura
  const markerIcon = useMemo(() => {
    if (!googleLoaded || typeof window === 'undefined' || !window.google) {
      return undefined;
    }
    
    return {
      url: "/icons/billboard.svg",
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 32),
    };
  }, [googleLoaded]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

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

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : ''}`}>
      <GoogleMapsLoader>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={16}
          onClick={onClick}
          options={{ 
            zoomControl: true, 
            streetViewControl: false, 
            fullscreenControl: false,
            mapTypeControl: true,
            scaleControl: true
          }}
        >
          <Marker 
            position={pos} 
            draggable 
            onDragEnd={onDragEnd}
            icon={markerIcon}
          />
        </GoogleMap>
      </GoogleMapsLoader>
      
      {/* Botón de pantalla completa */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={`absolute top-2 right-2 z-[10000] bg-white/90 hover:bg-white shadow-md border-2 ${isFullscreen ? 'top-4 right-4' : ''}`}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? (
          <>
            <Minimize2 className="w-4 h-4 mr-1" />
            Salir
          </>
        ) : (
          <>
            <Maximize2 className="w-4 h-4 mr-1" />
            Pantalla completa
          </>
        )}
      </Button>
    </div>
  );
}
