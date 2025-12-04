/**
 * Script para regenerar TODAS las variantes de productos incluyendo sucursales
 */

import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { supabaseServer } from '../lib/supabaseServer'
import { syncProductVariants } from '../lib/variantes/variantSync'

async function regenerarConSucursales() {
  console.log('🔄 Regenerando variantes de productos con sucursales (La Paz y Santa Cruz)...\n')

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

  console.log(`📦 Productos con variantes: ${productosConVariantes.length}\n`)

  let procesados = 0
  let actualizados = 0
  let errores = 0

  for (const producto of productosConVariantes) {
    procesados++
    console.log(`🔄 [${procesados}/${productosConVariantes.length}] ${producto.nombre || producto.codigo}`)
    
    try {
      // Eliminar variantes existentes
      await supabaseServer
        .from('producto_variantes')
        .delete()
        .eq('producto_id', producto.id)

      // Regenerar con sucursales
      await syncProductVariants(producto.id)
      
      // Verificar cuántas se generaron
      const { data: nuevas } = await supabaseServer
        .from('producto_variantes')
        .select('id')
        .eq('producto_id', producto.id)

      actualizados++
      console.log(`  ✅ ${nuevas?.length || 0} combinaciones generadas\n`)
    } catch (error: any) {
      errores++
      console.error(`  ❌ Error: ${error.message}\n`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN')
  console.log('='.repeat(60))
  console.log(`Productos procesados: ${procesados}`)
  console.log(`Productos actualizados: ${actualizados}`)
  console.log(`Errores: ${errores}`)
  console.log('='.repeat(60))
}

regenerarConSucursales()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
