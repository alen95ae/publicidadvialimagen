/**
 * Script para limpiar URLs blob de la tabla cotizacion_lineas
 * 
 * Este script busca todas las líneas que tienen URLs blob en los campos
 * imagen o imagen_url y las limpia estableciéndolas a null.
 * 
 * Ejecutar con: npx ts-node scripts/fixImagenes.ts
 */

import { getSupabaseServer } from '../lib/supabaseServer'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function fixImagenes() {
  console.log('🔧 Iniciando limpieza de URLs blob en cotizacion_lineas...\n')

  const supabase = getSupabaseServer()

  try {
    // Buscar todas las líneas con URLs blob
    // Nota: La tabla solo tiene la columna 'imagen', no 'imagen_url'
    const { data: lineasConBlob, error: selectError } = await supabase
      .from('cotizacion_lineas')
      .select('id, imagen')
      .like('imagen', 'blob:%')

    if (selectError) {
      console.error('❌ Error buscando líneas con blob:', selectError)
      process.exit(1)
    }

    if (!lineasConBlob || lineasConBlob.length === 0) {
      console.log('✅ No se encontraron líneas con URLs blob. Todo está limpio.')
      return
    }

    console.log(`📊 Encontradas ${lineasConBlob.length} líneas con URLs blob\n`)

    let actualizadas = 0
    let errores = 0

    // Actualizar cada línea
    for (const linea of lineasConBlob) {
      try {
        // Verificar si imagen es blob
        if (linea.imagen && linea.imagen.startsWith('blob:')) {
          const { error: updateError } = await supabase
            .from('cotizacion_lineas')
            .update({ imagen: null })
            .eq('id', linea.id)

          if (updateError) {
            console.error(`❌ Error actualizando línea ${linea.id}:`, updateError)
            errores++
          } else {
            console.log(`✅ Línea ${linea.id} limpiada`)
            actualizadas++
          }
        } else {
          // No hay blob, saltar esta línea
          console.log(`⏭️  Línea ${linea.id} no tiene blob, saltando`)
        }
      } catch (error) {
        console.error(`❌ Error procesando línea ${linea.id}:`, error)
        errores++
      }
    }

    console.log('\n📊 Resumen:')
    console.log(`   ✅ Líneas actualizadas: ${actualizadas}`)
    console.log(`   ❌ Errores: ${errores}`)
    console.log(`   📝 Total procesadas: ${lineasConBlob.length}`)

    if (actualizadas > 0) {
      console.log('\n✅ Limpieza completada exitosamente')
    } else if (errores > 0) {
      console.log('\n⚠️ Se encontraron errores durante la limpieza')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }
}

// Ejecutar el script
fixImagenes()
  .then(() => {
    console.log('\n✨ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })

