"use client";

import { useState } from "react";
// Mapa eliminado

const testPoints = [
  { id: "1", lat: -16.5000, lng: -68.1500, title: "La Paz", icon: "/icons/billboard.svg" },
  { id: "2", lat: -17.7833, lng: -63.1833, title: "Santa Cruz", icon: "/icons/billboard.svg" },
  { id: "3", lat: -17.3833, lng: -66.1667, title: "Cochabamba", icon: "/icons/billboard.svg" },
];

export default function TestMapPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">🧪 Prueba de Microfrontend</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-medium">🗺️ Mapa Eliminado</h2>
        <p className="text-gray-600">El mapa ha sido eliminado de esta página.</p>
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-medium mb-2">📋 Instrucciones de Diagnóstico:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Abre las herramientas de desarrollador (F12)</li>
          <li>Ve a la pestaña "Console"</li>
          <li>Recarga la página</li>
          <li>Observa los mensajes de consola</li>
          <li>Verifica que el mapa se carga correctamente</li>
        </ol>
      </div>
    </div>
  );
}
