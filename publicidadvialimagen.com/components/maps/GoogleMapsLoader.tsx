"use client";
import { useLoadScript } from "@react-google-maps/api";

export default function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
    // 👇 id fijo evita doble inyección del script y remounts del canvas
    id: "google-maps-script-web",
  });

  if (loadError) return <div className="w-full h-[400px] bg-red-100 rounded">Error cargando Google Maps</div>;
  if (!isLoaded) return <div className="w-full h-[400px] bg-gray-100 rounded">Cargando mapa…</div>;
  return <>{children}</>;
}
