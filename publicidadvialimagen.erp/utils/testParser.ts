import { parseGmapsUrl } from './parseGmapsUrl';

// Función de prueba para el parser
export function testParser() {
  const testUrls = [
    // Formato @lat,lng
    "https://www.google.com/maps/@-16.5000,-68.1500,17z",
    "https://www.google.com/maps/@-16.5,-68.15,17z",
    
    // Formato !3d!4d
    "https://www.google.com/maps/place/La+Paz/@-16.5000,-68.1500,17z/data=!3d-16.5000!4d-68.1500",
    
    // Formato q=
    "https://www.google.com/maps?q=-16.5000,-68.1500",
    "https://www.google.com/maps?q=-16.5,-68.15",
    
    // Formato ll=
    "https://www.google.com/maps?ll=-16.5000,-68.1500",
    
    // Formato center=
    "https://www.google.com/maps?center=-16.5000,-68.1500",
    
    // Coordenadas directas
    "-16.5000, -68.1500",
    "-16.5, -68.15",
    "-16, -68",
    
    // Formato place
    "https://www.google.com/maps/place/La+Paz/@-16.5000,-68.1500,17z",
    
    // URLs que NO deberían funcionar
    "https://www.google.com/maps/place/La+Paz",
    "https://www.google.com/maps/search/restaurants",
  ];

  console.log('🧪 Testing URL Parser...\n');
  
  testUrls.forEach((url, index) => {
    const result = parseGmapsUrl(url);
    console.log(`Test ${index + 1}: ${url.substring(0, 50)}...`);
    if (result) {
      console.log(`✅ Success: lat=${result.lat}, lng=${result.lng}\n`);
    } else {
      console.log(`❌ Failed: No coordinates found\n`);
    }
  });
}

// Ejecutar pruebas si se llama directamente
if (typeof window !== 'undefined') {
  testParser();
}
