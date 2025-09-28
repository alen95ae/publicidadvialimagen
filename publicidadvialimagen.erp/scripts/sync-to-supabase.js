const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración de Prisma
const prisma = new PrismaClient()

// Función para extraer coordenadas de Google Maps link
function extractCoordinatesFromGoogleMaps(link) {
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
async function syncSupport(support) {
  try {
    // Extraer coordenadas del link de Google Maps
    const coordinates = extractCoordinatesFromGoogleMaps(support.googleMapsLink)
    
    // Preparar datos para Supabase
    const supabaseData = {
      id: support.id,
      codigo: support.code,
      titulo: support.title,
      tipo: support.type,
      ancho_m: support.widthM,
      alto_m: support.heightM,
      area_total: support.areaM2,
      direccion: support.address,
      ciudad: support.city,
      provincia: support.country,
      estado: support.status.toLowerCase(),
      precio_mes: support.priceMonth,
      precio_m2: support.pricePerM2,
      foto_url: support.images?.[0] || null,
      foto_url_2: support.images?.[1] || null,
      foto_url_3: support.images?.[2] || null,
      condiciones_especiales: support.googleMapsLink,
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

    console.log(`✅ Soportes ${support.code} sincronizado correctamente`)
    return true
  } catch (error) {
    console.error(`Error procesando soporte ${support.code}:`, error)
    return false
  }
}

// Función principal de sincronización
async function syncAllSupports() {
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

  } catch (error) {
    console.error('❌ Error en la sincronización:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar sincronización si se llama directamente
if (require.main === module) {
  syncAllSupports()
}

module.exports = { syncAllSupports, syncSupport }
