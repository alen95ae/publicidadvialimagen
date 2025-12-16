import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.error('❌ [UPLOAD] No se recibió archivo')
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    console.log('📥 [UPLOAD] Recibido archivo:', {
      name: file.name,
      type: file.type,
      size: file.size,
      recursoId: id
    })

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('❌ [UPLOAD] Archivo demasiado grande:', file.size)
      return NextResponse.json(
        { success: false, error: 'El archivo no puede superar los 5MB' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.error('❌ [UPLOAD] Tipo de archivo inválido:', file.type)
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser una imagen (JPG, PNG, GIF)' },
        { status: 400 }
      )
    }

    // Obtener cliente de Supabase
    const supabase = getSupabaseServer()

    // Determinar bucket (usar variable de entorno o default a "soportes")
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'soportes'
    
    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `recursos/${id || 'new'}/${timestamp}-${sanitizedFilename}`

    console.log('📤 [UPLOAD] Subiendo a Supabase Storage:', {
      bucket: bucketName,
      path: path,
      size: file.size,
      type: file.type
    })

    // Convertir File a Buffer para Supabase
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false // No sobrescribir si existe
      })

    if (uploadError) {
      console.error('❌ [UPLOAD] Error subiendo a Storage:', uploadError)
      
      // Si el error es que el archivo ya existe, intentar con un nombre único
      if (uploadError.message.includes('already exists') || uploadError.message.includes('duplicate')) {
        const uniquePath = `recursos/${id || 'new'}/${timestamp}-${Math.random().toString(36).substring(7)}-${sanitizedFilename}`
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(uniquePath, buffer, {
            contentType: file.type || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          })
        
        if (retryError) {
          throw new Error(`Error subiendo imagen a Supabase Storage: ${retryError.message}`)
        }
        
        // Obtener URL pública
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(uniquePath)
        
        console.log('✅ [UPLOAD] Imagen subida correctamente (retry):', publicUrlData.publicUrl)
        
        return NextResponse.json({
          success: true,
          data: {
            publicUrl: publicUrlData.publicUrl
          }
        })
      }
      
      throw new Error(`Error subiendo imagen a Supabase Storage: ${uploadError.message}`)
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path)

    const publicUrl = publicUrlData.publicUrl

    console.log('✅ [UPLOAD] Imagen subida correctamente:', {
      path: path,
      publicUrl: publicUrl
    })

    return NextResponse.json({
      success: true,
      data: {
        publicUrl: publicUrl
      }
    })

  } catch (error: any) {
    console.error('❌ [UPLOAD] Error:', error)
    const errorMessage = error?.message || 'Error desconocido al subir la imagen'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}










