#!/usr/bin/env tsx
/**
 * Script para verificar las variables de entorno necesarias
 * Ejecutar con: npx tsx scripts/check-env.ts
 */

console.log('🔍 Verificando variables de entorno necesarias...\n')

const required = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID'
]

const optional = [
  'AIRTABLE_TOKEN',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_BASE_URL'
]

let allOk = true

console.log('📋 Variables REQUERIDAS:')
required.forEach(key => {
  const value = process.env[key]
  if (value) {
    // Mostrar solo los primeros y últimos caracteres por seguridad
    const masked = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***'
    console.log(`  ✅ ${key}: ${masked}`)
  } else {
    console.log(`  ❌ ${key}: NO CONFIGURADA`)
    allOk = false
  }
})

console.log('\n📋 Variables OPCIONALES:')
optional.forEach(key => {
  const value = process.env[key]
  if (value) {
    console.log(`  ✅ ${key}: ${value}`)
  } else {
    console.log(`  ⚠️  ${key}: No configurada (se usará valor por defecto)`)
  }
})

console.log('\n📝 NOTAS:')
console.log('  • AIRTABLE_API_KEY se puede usar como AIRTABLE_TOKEN')
console.log('  • Para obtener tu API Key: https://airtable.com/create/tokens')
console.log('  • El BASE_ID lo encuentras en: https://airtable.com/api')
console.log('  • Si no tienes AIRTABLE_TOKEN, las imágenes se guardarán localmente')

if (!allOk) {
  console.log('\n❌ Faltan variables requeridas. Revisa tu archivo .env.local')
  process.exit(1)
} else {
  console.log('\n✅ Todas las variables requeridas están configuradas')
}



