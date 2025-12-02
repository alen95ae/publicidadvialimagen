import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // ERROR #5: Manejar error en request.json() de forma robusta
    let body: { url?: string }
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('❌ [DELETE IMAGE] Error parseando JSON:', jsonError)
      return NextResponse.json(
        {
          success: false,
          error: 'El cuerpo de la solicitud no es un JSON válido'
        },
        { status: 400 }
      )
    }
    const { url } = body

    if (!url) {
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 })
    }

    // Extraer el path del archivo desde la URL pública
    // La URL de Supabase tiene formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.indexOf('public') + 1
    const bucketName = pathParts[bucketIndex]
    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    if (!filePath || !filePath.startsWith('cotizaciones/')) {
      return NextResponse.json({ success: false, error: 'Invalid file path' }, { status: 400 })
    }

    console.log('🗑️ [DELETE IMAGE] Eliminando imagen:', { bucket: bucketName, path: filePath })

    const supabase = getSupabaseServer()
    const bucket = process.env.SUPABASE_BUCKET_NAME || 'soportes'

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('❌ [DELETE IMAGE] Error eliminando:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('✅ [DELETE IMAGE] Imagen eliminada correctamente')

    return NextResponse.json({
      success: true,
      message: 'Imagen eliminada correctamente'
    })

  } catch (error: any) {
    console.error('❌ [DELETE IMAGE] Error:', error)
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}



