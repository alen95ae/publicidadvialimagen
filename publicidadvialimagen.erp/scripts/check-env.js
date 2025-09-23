// Script para verificar las variables de entorno
console.log('=== Verificando variables de entorno ===')

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

let allPresent = true

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${envVar}: NO ENCONTRADA`)
    allPresent = false
  }
})

if (allPresent) {
  console.log('\n✅ Todas las variables de entorno están configuradas')
} else {
  console.log('\n❌ Faltan variables de entorno. Por favor configura:')
  console.log('1. NEXT_PUBLIC_SUPABASE_URL')
  console.log('2. NEXT_PUBLIC_SUPABASE_ANON_KEY') 
  console.log('3. SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nPuedes encontrarlas en tu proyecto de Supabase en Settings > API')
}
