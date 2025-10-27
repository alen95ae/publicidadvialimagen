export type LatLng = { lat: number; lng: number };

/**
 * Valida si las coordenadas son válidas
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

/**
 * Expande enlaces cortos de Google Maps usando API endpoint
 */
async function expandShortUrl(shortUrl: string): Promise<string | null> {
  try {
    // Para enlaces cortos de Google Maps, usar API endpoint
    if (shortUrl.includes('goo.gl') || shortUrl.includes('maps.app.goo.gl')) {
      console.log('🔗 Expanding short URL via API:', shortUrl);
      
      const response = await fetch('/api/expand-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: shortUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.expandedUrl) {
          console.log('✅ URL expanded via API:', data.expandedUrl);
          return data.expandedUrl;
        }
      } else {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Error expanding URL via API:', error);
    return null;
  }
}

/**
 * Extrae lat/lng de links habituales de Google Maps:
 * - .../@40.123456,-3.654321,17z
 * - ?q=40.123,-3.456
 * - !3d40.123!4d-3.456
 * - &ll=40.123,-3.456
 * - Coordenadas directas: lat,lng
 * - Enlaces cortos (goo.gl, maps.app.goo.gl)
 * Si no encuentra, devuelve null.
 */
export async function parseGmapsUrl(input: string): Promise<LatLng | null> {
  try {
    let text = String(input).trim();
    console.log('🔍 Parsing URL:', text);

    // Limpiar la URL de caracteres problemáticos y caracteres al inicio
    text = text.replace(/\s+/g, '').replace(/[^\w\-\.\/\?\&\=\@\!\,\:\+]/g, '');
    
    // Remover caracteres problemáticos al inicio como @, #, etc.
    text = text.replace(/^[@#]+/, '');

    // Si es un enlace corto, expandirlo primero
    if (text.includes('goo.gl') || text.includes('maps.app.goo.gl')) {
      console.log('🔗 Detected short URL, expanding...');
      const expandedUrl = await expandShortUrl(text);
      if (expandedUrl) {
        text = expandedUrl;
        console.log('✅ Using expanded URL:', text);
      } else {
        console.log('❌ Could not expand short URL, trying direct parsing...');
        // Continuar con el parsing directo aunque no se haya expandido
        // Algunos enlaces cortos pueden tener coordenadas en el ID
        const shortIdMatch = text.match(/(?:goo\.gl|maps\.app\.goo\.gl)\/([A-Za-z0-9]+)/);
        if (shortIdMatch) {
          console.log('🔍 Trying to parse short URL ID:', shortIdMatch[1]);
          // Intentar decodificar el ID (aunque es poco probable que funcione)
          // Pero al menos intentamos
        }
      }
    }

    // Patrón 1: @lat,lng,zoom (más común en Google Maps)
    // Ejemplo: https://www.google.com/maps/@-16.5000,-68.1500,17z
    const atPattern = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const atMatch = atPattern.exec(text);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      console.log('📍 Found @ pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 2: !3dlat!4dlng (nuevo formato de Google Maps)
    // Ejemplo: https://www.google.com/maps/place/.../!3d-16.5000!4d-68.1500
    const bangPattern = /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/;
    const bangMatch = bangPattern.exec(text);
    if (bangMatch) {
      const lat = parseFloat(bangMatch[1]);
      const lng = parseFloat(bangMatch[2]);
      console.log('📍 Found !3d!4d pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 3: q=lat,lng
    // Ejemplo: https://www.google.com/maps?q=-16.5000,-68.1500
    const qPattern = /[?&]q=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const qMatch = qPattern.exec(text);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      console.log('📍 Found q= pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 4: &ll=lat,lng
    // Ejemplo: https://www.google.com/maps?ll=-16.5000,-68.1500
    const llPattern = /[?&]ll=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const llMatch = llPattern.exec(text);
    if (llMatch) {
      const lat = parseFloat(llMatch[1]);
      const lng = parseFloat(llMatch[2]);
      console.log('📍 Found ll= pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 5: center=lat,lng
    // Ejemplo: https://www.google.com/maps?center=-16.5000,-68.1500
    const centerPattern = /[?&]center=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const centerMatch = centerPattern.exec(text);
    if (centerMatch) {
      const lat = parseFloat(centerMatch[1]);
      const lng = parseFloat(centerMatch[2]);
      console.log('📍 Found center= pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 6: Coordenadas directas lat,lng (sin decimales también)
    // Ejemplo: -16.5000, -68.1500 o -16, -68
    const directPattern = /(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const directMatch = directPattern.exec(text);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      console.log('📍 Found direct coordinates:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 7: Formato de lugar con coordenadas
    // Ejemplo: https://www.google.com/maps/place/La+Paz/@-16.5000,-68.1500,17z
    const placePattern = /\/place\/[^\/]*\/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const placeMatch = placePattern.exec(text);
    if (placeMatch) {
      const lat = parseFloat(placeMatch[1]);
      const lng = parseFloat(placeMatch[2]);
      console.log('📍 Found place pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 8: Formato de dirección con coordenadas
    // Ejemplo: https://www.google.com/maps/dir//-16.5000,-68.1500
    const dirPattern = /\/dir\/\/\/(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
    const dirMatch = dirPattern.exec(text);
    if (dirMatch) {
      const lat = parseFloat(dirMatch[1]);
      const lng = parseFloat(dirMatch[2]);
      console.log('📍 Found dir pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 9: Formato de búsqueda con coordenadas (incluyendo + en longitud)
    // Ejemplo: https://www.google.com/maps/search/-17.391615,+-66.153479
    const searchPattern = /\/search\/(-?\d{1,3}(?:\.\d+)?),\s*\+?(-?\d{1,3}(?:\.\d+)?)/;
    const searchMatch = searchPattern.exec(text);
    if (searchMatch) {
      const lat = parseFloat(searchMatch[1]);
      const lng = parseFloat(searchMatch[2]);
      console.log('📍 Found search pattern:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    // Patrón 10: Intentar extraer coordenadas de cualquier parte de la URL
    // Último recurso para encontrar coordenadas en cualquier formato (incluyendo +)
    const anyCoordsPattern = /(-?\d{1,3}(?:\.\d+)?),\s*\+?(-?\d{1,3}(?:\.\d+)?)/g;
    let match;
    while ((match = anyCoordsPattern.exec(text)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('📍 Found potential coordinates:', { lat, lng });
      if (isValidCoordinate(lat, lng)) {
        return { lat, lng };
      }
    }

    console.log('❌ No coordinates found in URL');
    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}
