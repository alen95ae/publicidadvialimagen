// Script de prueba para verificar conexión a Supabase
// Ejecutar con: npx ts-node scripts/test-supabase-connection.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

console.log('🔍 Configuración:')
console.log('  URL:', supabaseUrl.substring(0, 30) + '...')
console.log('  Service Key:', supabaseServiceKey.substring(0, 20) + '...')
console.log('')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function test() {
  try {
    console.log('📊 Probando conexión a Supabase...')
    console.log('📊 Tabla: soportes')
    console.log('')
    
    // Test 1: Consulta simple
    console.log('Test 1: SELECT * FROM soportes LIMIT 1')
    const { data, error, count } = await supabase
      .from('soportes')
      .select('*', { count: 'exact' })
      .limit(1)
    
    if (error) {
      console.error('❌ Error:', error)
      console.error('  Code:', error.code)
      console.error('  Message:', error.message)
      console.error('  Details:', error.details)
      console.error('  Hint:', error.hint)
      return
    }
    
    console.log('✅ Consulta exitosa!')
    console.log('  Total registros:', count)
    console.log('  Primer registro:', data && data.length > 0 ? '✅' : '❌ (tabla vacía)')
    
    if (data && data.length > 0) {
      console.log('')
      console.log('📋 Columnas del primer registro:')
      console.log('  ', Object.keys(data[0]).join(', '))
      console.log('')
      console.log('📋 Datos del primer registro:')
      console.log(JSON.stringify(data[0], null, 2))
    }
    
    // Test 2: Verificar columnas específicas
    console.log('')
    console.log('Test 2: Verificando columnas específicas...')
    const expectedColumns = [
      'id',
      'codigo',
      'titulo',
      'tipo_soporte',
      'estado',
      'ciudad',
      'precio_mes',
      'latitud',
      'longitud'
    ]
    
    if (data && data.length > 0) {
      const firstRow = data[0] as any
      expectedColumns.forEach(col => {
        const exists = col in firstRow
        console.log(`  ${col}: ${exists ? '✅' : '❌'}`)
      })
    }
    
  } catch (err) {
    console.error('❌ Error inesperado:', err)
    if (err instanceof Error) {
      console.error('  Stack:', err.stack)
    }
  }
}

test()

