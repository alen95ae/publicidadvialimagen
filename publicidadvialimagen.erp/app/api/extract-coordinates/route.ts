export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { airtable } from '@/lib/airtable'

/** Extraer coordenadas de un enlace de Google Maps */
function extractCoordinatesFromUrl(url: string): { latitude: number | null, longitude: number | null } {
  try {
    // Patrón 1: /search/-16.498835,+-68.164877 o /search/-16.498835,-68.164877
    const searchPattern = /\/search\/(-?\d+\.?\d*),\+?(-?\d+\.?\d*)/
    const searchMatch = url.match(searchPattern)
    if (searchMatch) {
      return {
        latitude: parseFloat(searchMatch[1]),
        longitude: parseFloat(searchMatch[2])
      }
    }
    
    // Patrón 2: @-16.123,-68.456
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const atMatch = url.match(atPattern)
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      }
    }
    
    // Patrón 3: ?q=-16.123,-68.456
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const qMatch = url.match(qPattern)
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      }
    }
    
    // Patrón 4: ll=-16.123,-68.456
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    const llMatch = url.match(llPattern)
    if (llMatch) {
      return {
        latitude: parseFloat(llMatch[1]),
        longitude: parseFloat(llMatch[2])
      }
    }
    
    // Patrón 5: !3d-16.123!4d-68.456
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
    console.error(`⚠️ Error expandiendo ${shortUrl}:`, error)
    return shortUrl
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const forceUpdate = searchParams.get('force') === 'true'
    
    const { getAllSoportes, updateSoporte } = await import('@/lib/supabaseSoportes')
    const result = await getAllSoportes()
    const records = result.records
    
    // Filtrar solo los que necesitan actualización
    let recordsToProcess = records.filter(r => {
      const currentLat = r.fields['Latitud'] as number | undefined
      const currentLng = r.fields['Longitud'] as number | undefined
      const googleMapsLink = r.fields['Enlace Google Maps'] as string
      
      if (!googleMapsLink) return false
      if (forceUpdate) return true
      return !currentLat || !currentLng
    }).map(r => ({ id: r.id, fields: r.fields }))
    
    // Limitar cantidad a procesar
    if (limit > 0) {
      recordsToProcess = recordsToProcess.slice(0, limit)
    }
    
    const results = {
      total: records.length,
      toProcess: recordsToProcess.length,
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    }
    
    console.log(`🔍 Procesando ${recordsToProcess.length} soportes...`)
    
    for (const record of recordsToProcess) {
      const code = record.fields['Código'] as string
      const googleMapsLink = record.fields['Enlace Google Maps'] as string
      
      results.processed++
      console.log(`  [${results.processed}/${recordsToProcess.length}] Procesando ${code}...`)
      
      try {
        let fullUrl = googleMapsLink
        
        // Expandir si es un enlace acortado
        if (googleMapsLink.includes('goo.gl') || googleMapsLink.includes('maps.app.goo.gl')) {
          fullUrl = await expandShortUrl(googleMapsLink)
        }
        
        // Extraer coordenadas
        const coords = extractCoordinatesFromUrl(fullUrl)
        
        if (coords.latitude && coords.longitude) {
          // Actualizar en Supabase
          await updateSoporte(record.id, {
            'Latitud': coords.latitude,
            'Longitud': coords.longitude
          })
          
          results.updated++
          results.details.push({
            code,
            status: 'updated',
            latitude: coords.latitude,
            longitude: coords.longitude,
            originalLink: googleMapsLink,
            expandedLink: fullUrl !== googleMapsLink ? fullUrl : undefined
          })
        } else {
          results.errors++
          results.details.push({
            code,
            status: 'error',
            reason: 'No se pudieron extraer coordenadas',
            link: googleMapsLink,
            expandedLink: fullUrl !== googleMapsLink ? fullUrl : undefined
          })
        }
        
        // Pequeño delay para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 50))
        
      } catch (error: any) {
        results.errors++
        console.error(`  ❌ Error en ${code}:`, error.message)
        results.details.push({
          code,
          status: 'error',
          reason: error.message,
          link: googleMapsLink
        })
      }
    }
    
    console.log(`\n✅ Proceso completado:`)
    console.log(`   Procesados: ${results.processed}`)
    console.log(`   Actualizados: ${results.updated}`)
    console.log(`   Errores: ${results.errors}`)
    
    return NextResponse.json({
      success: true,
      message: `Se actualizaron ${results.updated} soportes de ${results.toProcess} procesados`,
      summary: {
        totalInDatabase: results.total,
        toProcess: results.toProcess,
        processed: results.processed,
        updated: results.updated,
        errors: results.errors
      },
      details: results.details
    })
    
  } catch (error: any) {
    console.error('❌ Error fatal:', error)
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 })
  }
}

