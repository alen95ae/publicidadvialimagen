import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { supabaseServer } from '../lib/supabaseServer'

async function buscar() {
  // IDs de recursos que SÍ tienen variantes
  const recursosConVariantes = [
    'fe2a912e-0603-4c58-809f-c46302b7db8b', // Adhesivo Blanco
    '8e60cdcf-7682-4c3f-9cd1-2595296ab4bc', // Instalación de Adhesivo
    '25dd705a-f9e0-4e24-a7eb-993fe830e0da', // Lona fondo negro
    'ae3c3836-1f97-464e-9264-2631a2307489', // INSUMO PRUEBA
    'fd458081-3ff2-4ea1-b3ae-acb42355150b', // Acrílico de color
    'd3c3d1c8-0785-4842-bc11-82a2151c7df0', // Lona frontligth
    '82a62c31-f017-413a-860a-f60a6a7b429d', // Lona Frontligth Fondo Blanco
    '96c99aec-80b0-4acb-bedb-bb5c6fd26596', // ITEM DE PRUEBA 2
    'da3aaa1b-9ec5-4845-a85d-8144bd643ce7'  // Desinstalacion de Adhesivo
  ]
  
  console.log('🔍 Buscando productos que usan recursos con variantes pero no tienen variantes...\n')
  
  const { data: productos, error } = await supabaseServer
    .from('productos')
    .select('id, nombre, receta, variante')
    .not('receta', 'is', null)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const productosProblema: any[] = []
  
  productos?.forEach(p => {
    let receta = p.receta || []
    if (typeof receta === 'object' && !Array.isArray(receta)) {
      receta = receta.items || []
    }
    if (!Array.isArray(receta)) receta = []
    
    // Verificar si la receta usa algún recurso con variantes
    const usaRecursoConVariantes = receta.some((r: any) => 
      r.recurso_id && recursosConVariantes.includes(r.recurso_id)
    )
    
    if (!usaRecursoConVariantes) return
    
    // Verificar si el producto tiene variantes válidas
    const tieneVariantesValidas = p.variante && 
      Array.isArray(p.variante) && 
      p.variante.length > 0 &&
      p.variante.some((v: any) => 
        v && v.nombre && Array.isArray(v.valores) && v.valores.length > 0
      )
    
    if (!tieneVariantesValidas) {
      productosProblema.push({
        id: p.id,
        nombre: p.nombre,
        variante: p.variante
      })
    }
  })
  
  console.log(`📦 Productos que usan recursos con variantes pero NO tienen variantes válidas: ${productosProblema.length}\n`)
  
  productosProblema.forEach(p => {
    console.log(`- "${p.nombre}" (${p.id})`)
    console.log(`  variante: ${JSON.stringify(p.variante)}`)
    console.log('')
  })
}

buscar().catch(console.error)
