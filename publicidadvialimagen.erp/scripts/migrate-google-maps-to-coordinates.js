#!/usr/bin/env node

/**
 * Script de migración para convertir googleMapsLink a coordenadas latitude/longitude
 * 
 * Uso: node scripts/migrate-google-maps-to-coordinates.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Función para extraer coordenadas de Google Maps link
function extractCoordinatesFromGoogleMaps(link) {
  try {
    // Patrones comunes de Google Maps
    const patterns = [
      // @lat,lng
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // !3d-lat!4d-lng
      /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
      // ll=lat,lng
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // center=lat,lng
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      // q=lat,lng
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
    ]

    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function migrateGoogleMapsToCoordinates() {
  console.log('🚀 Iniciando migración de Google Maps links a coordenadas...')
  
  try {
    // Buscar todos los soportes que tienen googleMapsLink pero no tienen coordenadas
    const supports = await prisma.support.findMany({
      where: {
        AND: [
          { googleMapsLink: { not: null } },
          { googleMapsLink: { not: '' } },
          {
            OR: [
              { latitude: null },
              { longitude: null }
            ]
          }
        ]
      },
      select: {
        id: true,
        code: true,
        title: true,
        googleMapsLink: true,
        latitude: true,
        longitude: true
      }
    })

    console.log(`📍 Encontrados ${supports.length} soportes para migrar`)

    let migrated = 0
    let failed = 0

    for (const support of supports) {
      console.log(`\n🔄 Procesando soporte ${support.code} - ${support.title}`)
      console.log(`   Google Maps Link: ${support.googleMapsLink}`)

      const coordinates = extractCoordinatesFromGoogleMaps(support.googleMapsLink)
      
      if (coordinates) {
        try {
          await prisma.support.update({
            where: { id: support.id },
            data: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            }
          })
          
          console.log(`   ✅ Migrado: lat=${coordinates.latitude}, lng=${coordinates.longitude}`)
          migrated++
        } catch (error) {
          console.log(`   ❌ Error al actualizar: ${error.message}`)
          failed++
        }
      } else {
        console.log(`   ⚠️  No se pudieron extraer coordenadas del link`)
        failed++
      }
    }

    console.log(`\n📊 Resumen de migración:`)
    console.log(`   ✅ Migrados exitosamente: ${migrated}`)
    console.log(`   ❌ Fallidos: ${failed}`)
    console.log(`   📍 Total procesados: ${supports.length}`)

    if (migrated > 0) {
      console.log(`\n🎉 Migración completada exitosamente!`)
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateGoogleMapsToCoordinates()
    .catch(console.error)
}

module.exports = { migrateGoogleMapsToCoordinates, extractCoordinatesFromGoogleMaps }
