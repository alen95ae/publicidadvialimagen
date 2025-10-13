"use client";
import { useState, useEffect } from "react";
import { parseGmapsUrl } from "@/utils/parseGmapsUrl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GmapsLinkPaste({ onCoords }: { onCoords: (c:{lat:number;lng:number})=>void }) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Parsing automático cuando cambia el valor
  useEffect(() => {
    const handleAutoParse = async () => {
      if (!value.trim()) return;
      
      // Solo procesar si parece ser una URL o coordenadas
      const isUrl = value.includes('http') || value.includes('maps') || value.includes('goo.gl');
      const isCoords = /^-?\d{1,3}(?:\.\d+)?,\s*-?\d{1,3}(?:\.\d+)?/.test(value);
      
      if (!isUrl && !isCoords) return;

      setIsLoading(true);
      
      try {
        console.log('🔍 Auto-parsing URL:', value);
        const coords = await parseGmapsUrl(value);
        console.log('📍 Parsed coordinates:', coords);
        
        if (coords) {
          console.log('✅ Coordinates extracted successfully');
          onCoords(coords);
          setValue(""); // Limpiar el input después del éxito
        } else {
          console.log('❌ No coordinates found - will retry on paste');
        }
      } catch (error) {
        console.error("Error auto-parsing URL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce para evitar demasiadas llamadas
    const timeoutId = setTimeout(handleAutoParse, 1000);
    return () => clearTimeout(timeoutId);
  }, [value, onCoords]);

  return (
    <div className="space-y-2">
      <Label htmlFor="gmaps-link">Pega un enlace de Google Maps</Label>
      <div className="relative">
        <Input
          id="gmaps-link"
          className="flex-1"
          placeholder="https://www.google.com/maps/place/.../@40.4168,-3.7038,17z"
          value={value}
          onChange={(e)=>setValue(e.target.value)}
          onPaste={(e) => {
            // Procesar inmediatamente al pegar
            setTimeout(() => {
              const pastedValue = e.clipboardData.getData('text');
              if (pastedValue) {
                setValue(pastedValue);
              }
            }, 0);
          }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
