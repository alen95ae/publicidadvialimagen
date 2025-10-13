import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return new NextResponse('API key not configured', { status: 500 });
  }

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Mapa Estable</title>
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        border-radius: 12px;
        overflow: hidden;
      }
    </style>
    <script>
      let googleMapsLoaded = false;
      let pendingInit = null;
      let map, markers = [];

      // Función para inicializar el mapa cuando Google Maps esté listo
      function initializeMap() {
        if (pendingInit && window.google) {
          const { center, points } = pendingInit;
          console.log('Inicializando mapa con:', { center, points });
          
          if (!map) {
            map = new google.maps.Map(document.getElementById("map"), {
              center,
              zoom: 6,
              gestureHandling: "greedy",
              streetViewControl: false,
              fullscreenControl: false,
              mapTypeControl: false,
              clickableIcons: false,
              mapId: "microfrontend-map",
            });
          }
          
          // Limpiar marcadores existentes
          markers.forEach((m) => m.setMap(null));
          markers = [];
          
          const bounds = new google.maps.LatLngBounds();
          points.forEach((p) => {
            const marker = new google.maps.Marker({
              position: { lat: p.lat, lng: p.lng },
              map,
              title: p.title || "",
              optimized: true,
              icon: {
                url: p.icon || "/icons/billboard.svg",
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              },
            });
            markers.push(marker);
            bounds.extend(marker.getPosition());
          });
          
          if (points.length > 1) {
            map.fitBounds(bounds);
          }
          
          pendingInit = null;
        }
      }

      // Cargar Google Maps directamente con la API key
      console.log('Cargando Google Maps con API key...');
      const script = document.createElement('script');
      script.src = \`https://maps.googleapis.com/maps/api/js?key=${apiKey}\`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps cargado correctamente');
        googleMapsLoaded = true;
        initializeMap();
      };
      script.onerror = () => {
        console.error('Error al cargar Google Maps');
      };
      document.head.appendChild(script);
    </script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      window.addEventListener("message", (event) => {
        if (!event.data || !event.data.type) return;
        const { type, payload } = event.data;
        
        if (type === "INIT_MAP") {
          console.log('Mensaje INIT_MAP recibido:', payload);
          
          if (googleMapsLoaded && window.google) {
            // Google Maps ya está cargado, inicializar inmediatamente
            initializeMap();
          } else {
            // Guardar los datos para cuando Google Maps esté listo
            pendingInit = payload;
            console.log('Esperando a que Google Maps se cargue...');
          }
        }
      });
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
