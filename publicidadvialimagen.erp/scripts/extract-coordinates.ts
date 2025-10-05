/**
 * Script para extraer coordenadas de enlaces de Google Maps y actualizar Airtable
 * 
 * Uso: npx tsx scripts/extract-coordinates.ts
 */

import Airtable from 'airtable'

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Faltan variables de entorno: AIRTABLE_API_KEY y AIRTABLE_BASE_ID')
  process.exit(1)
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID)

/** Extraer coordenadas de un enlace de Google Maps */
function extractCoordinatesFromUrl(url: string): { latitude: number | null, longitude: number | null } {
  try {
    // Patrones comunes en enlaces de Google Maps
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const atMatch = url.match(atPattern)
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      }
    }
    
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const qMatch = url.match(qPattern)
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      }
    }
    
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const llMatch = url.match(llPattern)
    if (llMatch) {
      return {
        latitude: parseFloat(llMatch[1]),
        longitude: parseFloat(llMatch[2])
      }
    }
    
    // Patrón para coordenadas en formato !3d-16.123!4d-68.456
    const dPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/
    const dMatch = url.match(dPattern)
    if (dMatch) {
      return {
        latitude: parseFloat(dMatch[1]),
        longitude: parseFloat(dMatch[2])
      }
    }
    
    return { latitude: null, longitude: null }
  } catch (error) {
    return { latitude: null, longitude: null }
  }
}

/** Expandir enlace acortado siguiendo redirecciones */
async function expandShortUrl(shortUrl: string): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    })
    return response.url
  } catch (error) {
    console.error(`   ⚠️  Error expandiendo ${shortUrl}:`, error)
    return shortUrl
  }
}

async function main() {
  console.log('🚀 Iniciando extracción de coordenadas...\n')
  
  try {
    const records = await base("Soportes").select({}).all()
    console.log(`📊 Total de soportes encontrados: ${records.length}\n`)
    
    let processed = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const record of records) {
      const code = record.fields['Código'] as string
      const googleMapsLink = record.fields['Enlace Google Maps'] as string
      const currentLat = record.fields['Latitud'] as number | undefined
      const currentLng = record.fields['Longitud'] as number | undefined
      
      processed++
      
      // Saltar si ya tiene coordenadas
      if (currentLat && currentLng) {
        skipped++
        process.stdout.write(`\r⏭️  ${processed}/${records.length} - ${code}: Ya tiene coordenadas`)
        continue
      }
      
      // Saltar si no tiene enlace
      if (!googleMapsLink) {
        skipped++
        process.stdout.write(`\r⏭️  ${processed}/${records.length} - ${code}: Sin enlace de Google Maps`)
        continue
      }
      
      try {
        process.stdout.write(`\r🔍 ${processed}/${records.length} - ${code}: Procesando...`)
        
        let fullUrl = googleMapsLink
        
        // Expandir si es un enlace acortado
        if (googleMapsLink.includes('goo.gl') || googleMapsLink.includes('maps.app.goo.gl')) {
          fullUrl = await expandShortUrl(googleMapsLink)
        }
        
        // Extraer coordenadas
        const coords = extractCoordinatesFromUrl(fullUrl)
        
        if (coords.latitude && coords.longitude) {
          // Actualizar en Airtable
          await base("Soportes").update(record.id, {
            'Latitud': coords.latitude,
            'Longitud': coords.longitude
          })
          
          updated++
          process.stdout.write(`\r✅ ${processed}/${records.length} - ${code}: ${coords.latitude}, ${coords.longitude}`)
          console.log() // Nueva línea
        } else {
          errors++
          process.stdout.write(`\r❌ ${processed}/${records.length} - ${code}: No se pudieron extraer coordenadas`)
          console.log() // Nueva línea
        }
        
        // Pequeño delay para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error: any) {
        errors++
        process.stdout.write(`\r❌ ${processed}/${records.length} - ${code}: Error - ${error.message}`)
        console.log() // Nueva línea
      }
    }
    
    console.log('\n\n📊 Resumen:')
    console.log(`   Total procesados: ${processed}`)
    console.log(`   ✅ Actualizados: ${updated}`)
    console.log(`   ⏭️  Omitidos (ya tenían coordenadas): ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log('\n✨ Proceso completado!\n')
    
  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  }
}

main()

