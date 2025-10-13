"use client";
import { useLoadScript } from "@react-google-maps/api";

// Definir libraries como constante para evitar re-renders
const LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: LIBRARIES,
  });

  if (loadError) {
    return (
      <div className="w-full h-[400px] bg-red-50 border border-red-200 rounded flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="font-medium">Error cargando Google Maps</p>
          <p className="text-sm mt-1">Verifica tu API Key en .env.local</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
          <p>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
