"use client";
import { GoogleMap } from "@react-google-maps/api";
import GoogleMapsLoader from "./GoogleMapsLoader";
import { useMemo, useRef } from "react";

export default function BranchMap({ lat, lng, label, height = 260 }: { lat: number; lng: number; label?: string; height?: number }) {
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const mapRef = useRef<google.maps.Map | null>(null);

  return (
    <GoogleMapsLoader>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height, borderRadius: 12 }}
        center={center}
        zoom={14}
        onLoad={(map) => {
          mapRef.current = map;
          map.setOptions({
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: "greedy",
            clickableIcons: false,
            mapId: "web-contacto-stable-canvas",
          });
          new google.maps.Marker({
            position: center,
            map,
            title: label,
            optimized: true,
            icon: {
              url: "/icons/building.svg",
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            },
          });
        }}
        onUnmount={() => { mapRef.current = null; }}
      />
    </GoogleMapsLoader>
  );
}
