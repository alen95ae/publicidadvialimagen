import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import { syncProductVariants } from '../lib/variantes/variantSync'

// Probar con ITEM DE PRUEBA
const productoId = '7580d386-1903-4f2e-b2df-c73ba0adaf42'

console.log(`🔄 Probando syncProductVariants para producto: ${productoId}\n`)

syncProductVariants(productoId)
  .then(() => {
    console.log('\n✅ Sync completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
