import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Función para extraer coordenadas de Google Maps link
function extractCoordinatesFromGoogleMaps(link: string | null): { lat: number, lng: number } | null {
  if (!link) return null
  
  try {
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    ]

    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// Función para sincronizar un soporte
async function syncSupport(support: any) {
  try {
    // Extraer coordenadas del link de Google Maps
    const coordinates = extractCoordinatesFromGoogleMaps(support.googleMapsLink)
    
    // Preparar datos para Supabase con nueva estructura
    const supabaseData = {
      id: support.id,
      codigo: support.code,
      titulo: support.title,
      tipo: support.type,
      ancho: support.widthM,
      alto: support.heightM,
      area_total: support.areaM2,
      ciudad: support.city,
      disponibilidad: support.status.toLowerCase(),
      precio_mes: support.priceMonth,
      impactos_diarios: support.impactosDiarios,
      ubicacion_url: support.googleMapsLink,
      foto_url: support.images?.[0] || null,
      foto_url_2: support.images?.[1] || null,
      foto_url_3: support.images?.[2] || null,
      dueno_casa_id: '00000000-0000-0000-0000-000000000000', // ID por defecto
      empleado_responsable_id: null,
      fecha_instalacion: null,
      fecha_ultimo_mantenimiento: null,
      proximo_mantenimiento: null,
      notas: `Impactos diarios: ${support.impactosDiarios || 'N/A'}, Iluminación: ${support.iluminacion ? 'Sí' : 'No'}`,
      created_at: support.createdAt,
      updated_at: support.updatedAt
    }

    // Si hay coordenadas, agregarlas
    if (coordinates) {
      supabaseData.ubicacion = `POINT(${coordinates.lng} ${coordinates.lat})`
    }

    // Insertar o actualizar en Supabase
    const { data, error } = await supabase
      .from('soportes')
      .upsert(supabaseData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error(`Error sincronizando soporte ${support.code}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error procesando soporte ${support.code}:`, error)
    return false
  }
}

export async function POST() {
  try {
    console.log('🔄 Iniciando sincronización de soportes...')
    
    // Obtener todos los soportes del ERP
    const supports = await prisma.support.findMany({
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Encontrados ${supports.length} soportes para sincronizar`)

    let successCount = 0
    let errorCount = 0

    // Sincronizar cada soporte
    for (const support of supports) {
      const success = await syncSupport(support)
      if (success) {
        successCount++
      } else {
        errorCount++
      }
    }

    console.log(`\n📈 Resumen de sincronización:`)
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📊 Total: ${supports.length}`)

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada',
      stats: {
        total: supports.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('❌ Error en la sincronización:', error)
    return NextResponse.json(
      { error: 'Error en la sincronización' },
      { status: 500 }
    )
  }
}
