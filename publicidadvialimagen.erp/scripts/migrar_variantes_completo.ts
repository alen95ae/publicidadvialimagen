
import { createClient } from '@supabase/supabase-js'
import { syncProductVariants } from '../lib/variantes/variantSync'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
    console.log('🚀 Iniciando migración masiva de variantes...')

    // 1. Obtener todos los productos
    const { data: productos, error } = await supabase
        .from('productos')
        .select('id, nombre')

    if (error) {
        console.error('❌ Error obteniendo productos:', error)
        process.exit(1)
    }

    console.log(`📦 Encontrados ${productos.length} productos. Procesando...`)

    let successCount = 0
    let errorCount = 0

    for (const p of productos) {
        try {
            console.log(`\n🔄 Procesando: ${p.nombre} (${p.id})`)
            await syncProductVariants(p.id)
            console.log(`✅ OK`)
            successCount++
        } catch (e: any) {
            console.error(`❌ Error en producto ${p.id}:`, e.message)
            errorCount++
        }
    }

    console.log('\n🎉 Migración completada.')
    console.log(`✅ Exitosos: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
}

main().catch(console.error)
