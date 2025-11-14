/**
 * ============================================================================
 * SCRIPT DE MIGRACIÓN DE IMÁGENES: AIRTABLE → SUPABASE STORAGE
 * ============================================================================
 * 
 * DESCRIPCIÓN:
 * Este script migra las imágenes del campo "imagen_principal" de las tablas
 * "productos" y "recursos" desde Airtable hacia Supabase Storage, y actualiza
 * las URLs en las tablas correspondientes de Supabase.
 * 
 * CONFIGURACIÓN (.env):
 * Crea un archivo .env en la raíz del proyecto con las siguientes variables:
 * 
 *   AIRTABLE_API_KEY=tu_api_key_de_airtable
 *   AIRTABLE_BASE_ID=tu_base_id_de_airtable
 *   SUPABASE_URL=https://tu-proyecto.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
 *   SUPABASE_BUCKET_NAME=nombre_del_bucket
 * 
 * DEPENDENCIAS A INSTALAR:
 * 
 *   npm install --save-dev dotenv @supabase/supabase-js airtable node-fetch @types/node-fetch
 * 
 * EJECUCIÓN:
 * 
 *   npx ts-node scripts/migrate-airtable-images.ts
 * 
 *   O agrega este script a package.json:
 *   "scripts": {
 *     "migrate:airtable-images": "ts-node scripts/migrate-airtable-images.ts"
 *   }
 *   
 *   Y luego ejecuta: npm run migrate:airtable-images
 * 
 * ============================================================================
 */

import * as dotenv from 'dotenv'
import Airtable from 'airtable'
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'

// Cargar variables de entorno
// Intentar cargar desde .env.local primero, luego .env
dotenv.config({ path: '.env.local' })
dotenv.config() // Fallback a .env si .env.local no existe

// ============================================================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// ============================================================================

const requiredEnvVars = [
  'AIRTABLE_API_KEY',
  'AIRTABLE_BASE_ID',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_BUCKET_NAME',
]

function validateEnv(): void {
  const missing = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error('❌ ERROR: Faltan las siguientes variables de entorno:')
    missing.forEach(varName => console.error(`   - ${varName}`))
    console.error('\nPor favor, configura estas variables en tu archivo .env')
    process.exit(1)
  }
  
  console.log('✅ Variables de entorno validadas correctamente\n')
}

// ============================================================================
// TIPOS
// ============================================================================

interface MigrationStats {
  processed: number
  migrated: number
  skipped: number
  errors: number
}

interface AirtableAttachment {
  id: string
  url: string
  filename: string
  size?: number
  type?: string
}

interface MigrateTableOptions {
  airtableTableName: 'productos' | 'recursos'
  supabaseTableName: 'productos' | 'recursos'
}

// ============================================================================
// CONFIGURACIÓN DE CLIENTES
// ============================================================================

function initializeClients() {
  // Cliente de Airtable
  const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY! })
  const base = airtable.base(process.env.AIRTABLE_BASE_ID!)
  
  // Cliente de Supabase (usando service role key para bypassear RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  return { base, supabase }
}

// ============================================================================
// FUNCIÓN AUXILIAR: DESCARGAR IMAGEN
// ============================================================================

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Error descargando imagen: ${response.statusText}`)
  }
  
  const buffer = await response.buffer()
  return buffer
}

// ============================================================================
// FUNCIÓN AUXILIAR: GENERAR NOMBRE DE ARCHIVO LIMPIO
// ============================================================================

function generateFileName(
  tableName: string,
  codigo: string,
  attachmentId: string,
  originalFilename: string
): string {
  // Extraer extensión del archivo original
  const ext = path.extname(originalFilename)
  
  // Limpiar el código para usarlo en el nombre de archivo (quitar caracteres especiales)
  const cleanCodigo = codigo.replace(/[^a-zA-Z0-9-]/g, '_')
  
  // Generar timestamp para evitar colisiones
  const timestamp = Date.now()
  
  // Formato: inventario/PROD-001_1234567890.jpg
  return `inventario/${cleanCodigo}_${timestamp}${ext}`
}

// ============================================================================
// FUNCIÓN PRINCIPAL: MIGRAR IMÁGENES DE UNA TABLA
// ============================================================================

async function migrateTableImages(options: MigrateTableOptions): Promise<MigrationStats> {
  const { airtableTableName, supabaseTableName } = options
  const { base, supabase } = initializeClients()
  
  const stats: MigrationStats = {
    processed: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  }
  
  console.log(`\n${'='.repeat(70)}`)
  console.log(`📦 Migrando imágenes de la tabla: "${airtableTableName}"`)
  console.log(`${'='.repeat(70)}\n`)
  
  try {
    // Obtener todos los registros de Airtable con paginación automática
    // Intentamos con ambos nombres de campos posibles
    const records = await base(airtableTableName)
      .select()
      .all()
    
    console.log(`📊 Total de registros encontrados: ${records.length}\n`)
    
    // Procesar cada registro secuencialmente
    for (const record of records) {
      stats.processed++
      
      // Intentar obtener el código con diferentes nombres de campo
      const codigo = (record.get('Código') || record.get('codigo') || record.get('ID')) as string
      const imagenPrincipal = (record.get('imagen_principal') || record.get('Imagen Principal')) as AirtableAttachment[] | undefined
      
      // Validar que existe el código
      if (!codigo) {
        console.log(`⚠️  Registro sin código (ID: ${record.id}), omitiendo...`)
        stats.skipped++
        continue
      }
      
      // Validar que existe la imagen
      if (!imagenPrincipal || !Array.isArray(imagenPrincipal) || imagenPrincipal.length === 0) {
        console.log(`⚠️  [${codigo}] Sin imagen, omitiendo...`)
        stats.skipped++
        continue
      }
      
      // Tomar la primera imagen del attachment
      const attachment = imagenPrincipal[0]
      
      try {
        console.log(`📥 [${codigo}] Descargando imagen: ${attachment.filename}`)
        
        // Descargar la imagen
        const imageBuffer = await downloadImage(attachment.url)
        
        // Generar nombre de archivo limpio
        const fileName = generateFileName(
          supabaseTableName,
          codigo,
          attachment.id,
          attachment.filename
        )
        
        console.log(`📤 [${codigo}] Subiendo a Storage: ${fileName}`)
        
        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(process.env.SUPABASE_BUCKET_NAME!)
          .upload(fileName, imageBuffer, {
            contentType: attachment.type || 'image/jpeg',
            upsert: true, // Sobrescribir si ya existe
          })
        
        if (uploadError) {
          throw new Error(`Error subiendo a Storage: ${uploadError.message}`)
        }
        
        // Obtener la URL pública
        // ESTRATEGIA: Usamos getPublicUrl() para obtener la URL completa y pública
        // que podemos guardar directamente en la base de datos.
        // Alternativa: guardar solo el path y construir la URL cuando se necesite.
        // Elegimos URL completa para simplificar el acceso desde el frontend.
        const { data: publicUrlData } = supabase.storage
          .from(process.env.SUPABASE_BUCKET_NAME!)
          .getPublicUrl(fileName)
        
        const publicUrl = publicUrlData.publicUrl
        
        console.log(`🔗 [${codigo}] URL pública: ${publicUrl}`)
        
        // Actualizar el registro en Supabase
        const { error: updateError } = await supabase
          .from(supabaseTableName)
          .update({ imagen_principal: publicUrl })
          .eq('codigo', codigo)
        
        if (updateError) {
          throw new Error(`Error actualizando Supabase: ${updateError.message}`)
        }
        
        console.log(`✅ [${codigo}] Migrado exitosamente\n`)
        stats.migrated++
        
        // Pequeña pausa para evitar saturar las APIs (100ms)
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ [${codigo}] Error:`, error instanceof Error ? error.message : error)
        stats.errors++
      }
    }
    
  } catch (error) {
    console.error(`❌ Error fatal al procesar la tabla "${airtableTableName}":`, error)
    throw error
  }
  
  // Resumen de la migración
  console.log(`\n${'='.repeat(70)}`)
  console.log(`📊 RESUMEN - Tabla "${airtableTableName}":`)
  console.log(`${'='.repeat(70)}`)
  console.log(`   Procesados: ${stats.processed}`)
  console.log(`   Migrados:   ${stats.migrated} ✅`)
  console.log(`   Omitidos:   ${stats.skipped} ⚠️`)
  console.log(`   Errores:    ${stats.errors} ❌`)
  console.log(`${'='.repeat(70)}\n`)
  
  return stats
}

// ============================================================================
// FUNCIÓN MAIN
// ============================================================================

async function main() {
  console.log('\n🚀 INICIANDO MIGRACIÓN DE IMÁGENES: AIRTABLE → SUPABASE STORAGE\n')
  
  // Validar variables de entorno
  validateEnv()
  
  const startTime = Date.now()
  
  try {
    // Migrar tabla "productos"
    const productosStats = await migrateTableImages({
      airtableTableName: 'productos',
      supabaseTableName: 'productos',
    })
    
    // Migrar tabla "recursos"
    const recursosStats = await migrateTableImages({
      airtableTableName: 'recursos',
      supabaseTableName: 'recursos',
    })
    
    // Resumen global
    const totalProcessed = productosStats.processed + recursosStats.processed
    const totalMigrated = productosStats.migrated + recursosStats.migrated
    const totalSkipped = productosStats.skipped + recursosStats.skipped
    const totalErrors = productosStats.errors + recursosStats.errors
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n' + '='.repeat(70))
    console.log('🎉 MIGRACIÓN COMPLETADA')
    console.log('='.repeat(70))
    console.log(`   Total procesados: ${totalProcessed}`)
    console.log(`   Total migrados:   ${totalMigrated} ✅`)
    console.log(`   Total omitidos:   ${totalSkipped} ⚠️`)
    console.log(`   Total errores:    ${totalErrors} ❌`)
    console.log(`   Duración:         ${duration}s`)
    console.log('='.repeat(70) + '\n')
    
    if (totalErrors > 0) {
      console.log('⚠️  La migración se completó pero con algunos errores. Revisa los logs arriba.')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error)
    process.exit(1)
  }
}

// Ejecutar el script
main()

