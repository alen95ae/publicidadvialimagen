"use client";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useMemo } from "react";
import GoogleMapsLoader from "./GoogleMapsLoader";

export default function SingleSupportMap({
  lat, lng, height = 300
}: { lat: number; lng: number; height?: number }) {
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const mapContainerStyle = useMemo(() => ({ width: "100%", height, borderRadius: 12 }), [height]);

  return (
    <GoogleMapsLoader>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={15} options={{ streetViewControl:false }}>
        <Marker
          position={{ lat, lng }}
          icon={typeof window !== 'undefined' && window.google ? {
            url: "/icons/billboard.svg",
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          } : undefined}
        />
      </GoogleMap>
    </GoogleMapsLoader>
  );
}
