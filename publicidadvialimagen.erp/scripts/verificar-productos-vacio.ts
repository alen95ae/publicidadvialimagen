import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { supabaseServer } from '../lib/supabaseServer'

async function verificar() {
  console.log('🔍 Buscando productos con variante: [] que usan recursos con variantes...\n')
  
  // Buscar productos con variante vacío o null
  const { data: productos, error } = await supabaseServer
    .from('productos')
    .select('id, nombre, receta, variante')
    .not('receta', 'is', null)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const productosVacios = productos?.filter(p => {
    const variante = p.variante
    if (!variante) return true
    if (!Array.isArray(variante)) return true
    if (variante.length === 0) return true
    // Verificar si todas las variantes tienen valores vacíos
    return variante.every((v: any) => 
      !v.valores || !Array.isArray(v.valores) || v.valores.length === 0
    )
  }) || []
  
  console.log(`📦 Productos con variante vacío o sin valores: ${productosVacios.length}\n`)
  
  let encontrados = 0
  
  // Para cada producto, verificar qué recursos usa
  for (const p of productosVacios) {
    let receta = p.receta || []
    if (typeof receta === 'object' && !Array.isArray(receta)) {
      receta = receta.items || []
    }
    if (!Array.isArray(receta)) receta = []
    
    const recursoIds = receta.map((r: any) => r.recurso_id).filter(Boolean)
    
    if (recursoIds.length === 0) continue
    
    const { data: recursos } = await supabaseServer
      .from('recursos')
      .select('id, nombre, variantes')
      .in('id', recursoIds)
    
    const recursosConVariantes = recursos?.filter(r => {
      if (!r.variantes) return false
      if (Array.isArray(r.variantes) && r.variantes.length > 0) {
        return r.variantes.some((v: any) => {
          const valores = Array.isArray(v.valores) ? v.valores : Array.isArray(v.posibilidades) ? v.posibilidades : []
          return valores.length > 0
        })
      }
      return false
    }) || []
    
    if (recursosConVariantes.length > 0) {
      encontrados++
      console.log(`\n📋 [${encontrados}] "${p.nombre}" (${p.id})`)
      console.log(`  variante actual: ${JSON.stringify(p.variante)}`)
      console.log(`  Recursos con variantes en receta:`)
      recursosConVariantes.forEach(r => {
        console.log(`    - "${r.nombre}" (${r.id})`)
        if (Array.isArray(r.variantes)) {
          r.variantes.forEach((v: any) => {
            const valores = Array.isArray(v.valores) ? v.valores : Array.isArray(v.posibilidades) ? v.posibilidades : []
            if (valores.length > 0) {
              console.log(`      ${v.nombre}: [${valores.join(', ')}]`)
            }
          })
        }
      })
    }
  }
  
  console.log(`\n✅ Total productos encontrados que necesitan reconstrucción: ${encontrados}`)
}

verificar().catch(console.error)
