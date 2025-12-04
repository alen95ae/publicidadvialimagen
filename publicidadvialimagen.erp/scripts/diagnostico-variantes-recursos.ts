import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { supabaseServer } from '../lib/supabaseServer'

async function diagnosticar() {
  console.log('🔍 Buscando recursos con variantes...\n')
  
  const { data: recursos, error } = await supabaseServer
    .from('recursos')
    .select('id, nombre, variantes')
    .not('variantes', 'is', null)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`📦 Total recursos con campo variantes no null: ${recursos?.length || 0}\n`)
  
  const recursosConVariantes = recursos?.filter(r => {
    if (!r.variantes) return false
    if (Array.isArray(r.variantes) && r.variantes.length > 0) {
      // Verificar que tenga valores
      return r.variantes.some((v: any) => {
        const valores = Array.isArray(v.valores) ? v.valores : Array.isArray(v.posibilidades) ? v.posibilidades : []
        return valores.length > 0
      })
    }
    return false
  }) || []
  
  console.log(`✅ Recursos con variantes válidas: ${recursosConVariantes.length}\n`)
  
  recursosConVariantes.forEach(r => {
    console.log(`📋 "${r.nombre}" (${r.id}):`)
    if (Array.isArray(r.variantes)) {
      r.variantes.forEach((v: any) => {
        const valores = Array.isArray(v.valores) ? v.valores : Array.isArray(v.posibilidades) ? v.posibilidades : []
        console.log(`  - ${v.nombre}: [${valores.join(', ')}]`)
      })
    }
    console.log('')
  })
}

diagnosticar().catch(console.error)
