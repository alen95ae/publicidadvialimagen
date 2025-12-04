/**
 * Script para regenerar variantes de TODOS los productos que tienen definiciones
 * pero no tienen registros en producto_variantes
 */

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { supabaseServer } from '../lib/supabaseServer'
import { syncProductVariants } from '../lib/variantes/variantSync'

async function regenerarTodas() {
  console.log('🔄 Buscando productos con variantes definidas pero sin combinaciones...\n')

  // 1. Obtener todos los productos que tienen variante definido
  const { data: productos, error } = await supabaseServer
    .from('productos')
    .select('id, nombre, codigo, variante')
    .not('variante', 'is', null)

  if (error) {
    console.error('Error:', error)
    return
  }

  // Filtrar solo productos con variantes válidas
  const productosConVariantes = productos?.filter(p => {
    if (!Array.isArray(p.variante)) return false
    if (p.variante.length === 0) return false
    return p.variante.some((v: any) => 
      v && v.nombre && Array.isArray(v.valores) && v.valores.length > 0
    )
  }) || []

  console.log(`📦 Productos con variantes definidas: ${productosConVariantes.length}\n`)

  let procesados = 0
  let actualizados = 0
  let saltados = 0

  for (const producto of productosConVariantes) {
    procesados++

    // Verificar si tiene registros en producto_variantes
    const { data: variantes, error: varError } = await supabaseServer
      .from('producto_variantes')
      .select('id')
      .eq('producto_id', producto.id)
      .limit(1)

    if (variantes && variantes.length > 0) {
      saltados++
      console.log(`✅ [${procesados}/${productosConVariantes.length}] ${producto.nombre || producto.codigo}: Ya tiene variantes generadas, saltando`)
      continue
    }

    // Regenerar variantes
    console.log(`🔄 [${procesados}/${productosConVariantes.length}] ${producto.nombre || producto.codigo}: Regenerando variantes...`)
    
    try {
      await syncProductVariants(producto.id)
      actualizados++
      console.log(`  ✅ Variantes generadas correctamente\n`)
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}\n`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN')
  console.log('='.repeat(60))
  console.log(`Productos procesados: ${procesados}`)
  console.log(`Productos actualizados: ${actualizados}`)
  console.log(`Productos saltados: ${saltados}`)
  console.log('='.repeat(60))
}

regenerarTodas()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

