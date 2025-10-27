"use client";
import { useState, useEffect } from "react";
import { parseGmapsUrl } from "@/utils/parseGmapsUrl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GmapsLinkPaste({ onCoords }: { onCoords: (c:{lat:number;lng:number})=>void }) {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parsing automático cuando cambia el valor
  useEffect(() => {
    const handleAutoParse = async () => {
      if (!value.trim()) {
        setError(null);
        setSuccess(false);
        return;
      }
      
      // Solo procesar si parece ser una URL o coordenadas
      const cleanValue = value.replace(/^[@#]+/, '').trim();
      const isUrl = cleanValue.includes('http') || cleanValue.includes('maps') || cleanValue.includes('goo.gl');
      const isCoords = /^-?\d{1,3}(?:\.\d+)?,\s*-?\d{1,3}(?:\.\d+)?/.test(cleanValue);
      
      if (!isUrl && !isCoords) {
        setError('Formato no válido. Ingresa una URL de Google Maps o coordenadas (lat,lng)');
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      try {
        console.log('🔍 Auto-parsing URL:', value);
        const coords = await parseGmapsUrl(value);
        console.log('📍 Parsed coordinates:', coords);
        
        if (coords) {
          console.log('✅ Coordinates extracted successfully');
          onCoords(coords);
          setSuccess(true);
          setError(null);
          // Limpiar el input después del éxito con un pequeño delay
          setTimeout(() => {
            setValue("");
            setSuccess(false);
          }, 1500);
        } else {
          console.log('❌ No coordinates found');
          setError('No se pudieron extraer coordenadas de este enlace. Verifica que sea una URL válida de Google Maps.');
        }
      } catch (error) {
        console.error("Error auto-parsing URL:", error);
        setError('Error al procesar el enlace. Intenta nuevamente.');
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
          className={`flex-1 ${error ? 'border-red-500' : success ? 'border-green-500' : ''}`}
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
        {success && !isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="text-green-500 text-lg">✓</div>
          </div>
        )}
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200">
          ✓ Coordenadas extraídas correctamente
        </div>
      )}
    </div>
  );
}
