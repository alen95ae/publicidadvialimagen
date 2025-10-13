"use client";
import { GoogleMap } from "@react-google-maps/api";
import GoogleMapsLoader from "./GoogleMapsLoader";
import { useMemo, useRef } from "react";

export default function SingleSupportMap({ lat, lng, height = 320 }: { lat: number; lng: number; height?: number }) {
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const mapRef = useRef<google.maps.Map | null>(null);

  return (
    <GoogleMapsLoader>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height, borderRadius: 12 }}
        center={center}
        zoom={15}
        onLoad={(map) => {
          mapRef.current = map;
          map.setOptions({
            streetViewControl: false,
            zoomControl: true,
            gestureHandling: "greedy",
            clickableIcons: false,
            mapId: "web-producto-stable-canvas",
          });
          // marcador único imperativo
          new google.maps.Marker({
            position: center,
            map,
            optimized: true,
            icon: {
              url: "/icons/billboard.svg",
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
