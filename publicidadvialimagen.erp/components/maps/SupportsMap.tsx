"use client";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { MarkerClustererF } from "@react-google-maps/api";
import { useMemo } from "react";
import GoogleMapsLoader from "./GoogleMapsLoader";

export type SupportPoint = { id: string; lat: number; lng: number; title?: string };

export default function SupportsMap({
  points,
  height = 500,
}: { points: SupportPoint[]; height?: number }) {
  const center = useMemo(() => {
    if (!points.length) return { lat: 40.4168, lng: -3.7038 };
    const [first] = points;
    return { lat: first.lat, lng: first.lng };
  }, [points]);

  const mapContainerStyle = useMemo(() => ({ width: "100%", height, borderRadius: 12 }), [height]);

  return (
    <GoogleMapsLoader>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={5}
        options={{ zoomControl: true, streetViewControl: false, fullscreenControl: false }}
      >
        <MarkerClustererF>
          {(clusterer) =>
            points.map((p) => (
              <Marker
                key={p.id}
                position={{ lat: p.lat, lng: p.lng }}
                title={p.title}
                clusterer={clusterer}
                icon={typeof window !== 'undefined' && window.google ? {
                  url: "/icons/billboard.svg",
                  scaledSize: new window.google.maps.Size(32, 32),
                  anchor: new window.google.maps.Point(16, 16),
                } : undefined}
              />
            ))
          }
        </MarkerClustererF>
      </GoogleMap>
    </GoogleMapsLoader>
  );
}
