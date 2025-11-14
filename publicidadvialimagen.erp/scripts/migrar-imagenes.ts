// Cargar variables de entorno PRIMERO, antes de importar módulos que las necesitan
import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"

const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

// Ahora importar módulos que necesitan las variables de entorno
import { getSupabaseServer } from "../lib/supabaseServer"
import Airtable from "airtable"

// Usar fetch nativo (Node.js 18+) o importar node-fetch si es necesario
// @ts-ignore - fetch está disponible globalmente en Node.js 18+
const fetch = globalThis.fetch || require("node-fetch")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_BASE_ID

// Verificar variables de entorno
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: Faltan variables de entorno de Supabase")
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✅" : "❌")
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", SERVICE_KEY ? "✅" : "❌")
  process.exit(1)
}

if (!AIRTABLE_API_KEY || !BASE_ID) {
  console.error("❌ Error: Faltan variables de entorno de Airtable")
  console.error("  AIRTABLE_API_KEY:", AIRTABLE_API_KEY ? "✅" : "❌")
  console.error("  AIRTABLE_BASE_ID:", BASE_ID ? "✅" : "❌")
  process.exit(1)
}

const supabase = getSupabaseServer()
const TABLE_ID = "tblK9aBuSdOhDqbf1" // Tabla Soportes en Airtable

// Función para descargar y subir una imagen a Supabase Storage
async function uploadToSupabase(url: string, filename: string): Promise<string> {
  try {
    console.log(`    📥 Descargando: ${url}`)
    
    // Descargar la imagen desde Airtable
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error descargando archivo: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detectar tipo MIME
    const contentType = response.headers.get("content-type") || "image/png"
    
    // Generar nombre único
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `imagenes/${timestamp}-${sanitizedFilename}`

    console.log(`    📤 Subiendo a: ${storagePath}`)

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("soportes")
      .upload(storagePath, buffer, {
        contentType,
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Obtener URL pública
    const { data } = supabase.storage
      .from("soportes")
      .getPublicUrl(storagePath)

    console.log(`    ✅ URL pública: ${data.publicUrl}`)
    return data.publicUrl
  } catch (error) {
    console.error(`    ❌ Error en uploadToSupabase:`, error)
    throw error
  }
}

// Función principal de migración
async function startMigration() {
  console.log("🚀 Iniciando migración de imágenes de Airtable → Supabase\n")
  console.log("📋 Configuración:")
  console.log(`   Supabase URL: ${SUPABASE_URL?.substring(0, 30)}...`)
  console.log(`   Airtable Base: ${BASE_ID}`)
  console.log(`   Tabla: ${TABLE_ID}\n`)

  // Verificar que el bucket existe
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    console.error("❌ Error listando buckets:", bucketsError)
    process.exit(1)
  }

  const soportesBucket = buckets?.find(b => b.name === "soportes")
  if (!soportesBucket) {
    console.error("❌ Error: El bucket 'soportes' no existe en Supabase Storage")
    console.error("   Por favor, créalo desde el dashboard de Supabase")
    process.exit(1)
  }

  console.log("✅ Bucket 'soportes' encontrado\n")

  let totalProcessed = 0
  let totalWithImages = 0
  let totalImagesUploaded = 0
  let totalErrors = 0

  // Crear instancia de Airtable con la API key
  const base = new Airtable({ apiKey: AIRTABLE_API_KEY! }).base(BASE_ID!)

  try {
    await base(TABLE_ID)
      .select()
      .eachPage(async (records, fetchNextPage) => {
        for (const record of records) {
          totalProcessed++
          const codigo = record.get("Código") as string | undefined
          
          if (!codigo) {
            console.log(`⏭️  Registro ${totalProcessed}: Sin código, saltando...`)
            continue
          }

          console.log(`\n📦 [${totalProcessed}] Procesando soporte: ${codigo}`)

          const imagenPrincipal = record.get("Imagen principal") as any[] | undefined
          const imagenSec1 = record.get("Imagen secundaria 1") as any[] | undefined
          const imagenSec2 = record.get("Imagen secundaria 2") as any[] | undefined

          const updatePayload: any = {}

          // Verificar si tiene imágenes
          const hasImages = 
            (imagenPrincipal && imagenPrincipal.length > 0) ||
            (imagenSec1 && imagenSec1.length > 0) ||
            (imagenSec2 && imagenSec2.length > 0)

          if (!hasImages) {
            console.log(`   ℹ️  Sin imágenes para migrar`)
            continue
          }

          totalWithImages++

          // Imagen Principal
          if (imagenPrincipal && imagenPrincipal.length > 0) {
            try {
              const attachment = imagenPrincipal[0]
              const url = attachment.url
              const filename = attachment.filename || `principal-${codigo}.png`
              
              const supaUrl = await uploadToSupabase(url, filename)
              updatePayload.imagen_principal = [{ url: supaUrl }]
              totalImagesUploaded++
              console.log(`   ✅ Imagen principal migrada`)
            } catch (error) {
              console.error(`   ❌ Error migrando imagen principal:`, error)
              totalErrors++
            }
          }

          // Imagen Secundaria 1
          if (imagenSec1 && imagenSec1.length > 0) {
            try {
              const attachment = imagenSec1[0]
              const url = attachment.url
              const filename = attachment.filename || `sec1-${codigo}.png`
              
              const supaUrl = await uploadToSupabase(url, filename)
              updatePayload.imagen_secundaria_1 = [{ url: supaUrl }]
              totalImagesUploaded++
              console.log(`   ✅ Imagen secundaria 1 migrada`)
            } catch (error) {
              console.error(`   ❌ Error migrando imagen secundaria 1:`, error)
              totalErrors++
            }
          }

          // Imagen Secundaria 2
          if (imagenSec2 && imagenSec2.length > 0) {
            try {
              const attachment = imagenSec2[0]
              const url = attachment.url
              const filename = attachment.filename || `sec2-${codigo}.png`
              
              const supaUrl = await uploadToSupabase(url, filename)
              updatePayload.imagen_secundaria_2 = [{ url: supaUrl }]
              totalImagesUploaded++
              console.log(`   ✅ Imagen secundaria 2 migrada`)
            } catch (error) {
              console.error(`   ❌ Error migrando imagen secundaria 2:`, error)
              totalErrors++
            }
          }

          // Actualizar registro en Supabase usando el campo "codigo"
          if (Object.keys(updatePayload).length > 0) {
            try {
              const { error: updateError, data: updateData } = await supabase
                .from("soportes")
                .update(updatePayload)
                .eq("codigo", codigo)
                .select()

              if (updateError) {
                console.error(`   ❌ Error actualizando en Supabase:`, updateError)
                totalErrors++
              } else {
                if (updateData && updateData.length > 0) {
                  console.log(`   ✅ Registro actualizado en Supabase`)
                } else {
                  console.log(`   ⚠️  No se encontró registro con código: ${codigo}`)
                }
              }
            } catch (error) {
              console.error(`   ❌ Error actualizando registro:`, error)
              totalErrors++
            }
          }
        }

        fetchNextPage()
      })

    console.log("\n" + "=".repeat(60))
    console.log("🎉 Migración completada!")
    console.log("=".repeat(60))
    console.log(`📊 Estadísticas:`)
    console.log(`   Total registros procesados: ${totalProcessed}`)
    console.log(`   Registros con imágenes: ${totalWithImages}`)
    console.log(`   Imágenes subidas: ${totalImagesUploaded}`)
    console.log(`   Errores: ${totalErrors}`)
    console.log("=".repeat(60))

  } catch (error) {
    console.error("\n❌ Error en la migración:", error)
    process.exit(1)
  }
}

// Ejecutar migración
startMigration().catch((error) => {
  console.error("❌ Error fatal:", error)
  process.exit(1)
})

