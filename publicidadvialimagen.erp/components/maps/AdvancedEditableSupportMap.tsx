"use client";
import { GoogleMap, AdvancedMarker } from "@react-google-maps/api";
import { useMemo, useState, useCallback, useEffect } from "react";
import GoogleMapsLoader from "./GoogleMapsLoader";

type Props = {
  lat: number;
  lng: number;
  onChange: (c: { lat: number; lng: number }) => void;
  height?: number; // px
};

export default function AdvancedEditableSupportMap({ lat, lng, onChange, height = 400 }: Props) {
  const [pos, setPos] = useState({ lat, lng });
  const [googleLoaded, setGoogleLoaded] = useState(false);
  
  const center = useMemo(() => ({ lat: pos.lat, lng: pos.lng }), [pos]);
  const mapContainerStyle = useMemo(() => ({ width: "100%", height, borderRadius: 12 }), [height]);

  // Verificar que Google Maps esté cargado
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      setGoogleLoaded(true);
    }
  }, []);

  const onClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat(); const lng = e.latLng?.lng();
    if (lat && lng) { setPos({ lat, lng }); onChange({ lat, lng }); }
  }, [onChange]);

  const onDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat(); const lng = e.latLng?.lng();
    if (lat && lng) { setPos({ lat, lng }); onChange({ lat, lng }); }
  }, [onChange]);

  return (
    <GoogleMapsLoader>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={16}
        onClick={onClick}
        options={{ zoomControl: true, streetViewControl: false, fullscreenControl: false }}
        mapId="DEMO_MAP_ID" // Necesario para AdvancedMarker
      >
        <AdvancedMarker 
          position={pos} 
          draggable 
          onDragEnd={onDragEnd}
        >
          <div className="w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="2" y="2" width="12" height="8" rx="1" fill="white"/>
              <rect x="6" y="10" width="4" height="4" fill="white"/>
            </svg>
          </div>
        </AdvancedMarker>
      </GoogleMap>
    </GoogleMapsLoader>
  );
}
