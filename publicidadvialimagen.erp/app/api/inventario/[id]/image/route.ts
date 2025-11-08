import { NextRequest, NextResponse } from 'next/server'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'

const AIRTABLE_API = 'https://api.airtable.com/v0'
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY

async function createAirtableAttachment(filename: string, mimeType?: string) {
  if (!AIRTABLE_TOKEN) {
    throw new Error('AIRTABLE_API_KEY o AIRTABLE_TOKEN no configurado en .env.local')
  }

  const body: any = {
    type: 'file',
    filename: filename || 'imagen.png'
  }

  // Añadir contentType solo si está disponible
  if (mimeType) {
    body.contentType = mimeType
  }

  console.log('🗂️ [ATTACH] Creando attachment en Airtable:', {
    endpoint: `${AIRTABLE_API}/attachments`,
    filename: body.filename,
    contentType: body.contentType
  })

  const response = await fetch(`${AIRTABLE_API}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    cache: 'no-store'
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [ATTACH] Error creando attachment:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    })
    throw new Error(`Create attachment failed: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  return result as { id: string; upload_url: string }
}

function ensureUploadsDir() {
  const dir = join(process.cwd(), 'public', 'uploads')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function fallbackSave(file: File, buffer: Buffer) {
  const dir = ensureUploadsDir()
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `inventory_${Date.now()}_${safeName}`
  const relativePath = `/uploads/${fileName}`
  writeFileSync(join(dir, fileName), buffer)
  console.log('✅ [ATTACH] Fallback: Archivo guardado localmente →', relativePath)
  console.log('✅ [ATTACH] La URL relativa se convertirá a absoluta antes de enviar a Airtable')
  return relativePath
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const { id } = await Promise.resolve(params)
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      console.error('❌ [ATTACH] No se recibió archivo')
      return NextResponse.json({ success: false, error: 'No file' }, { status: 400 })
    }

    console.log('📥 [ATTACH] Recibido archivo:', {
      name: file.name,
      type: file.type,
      size: file.size,
      hasToken: !!AIRTABLE_TOKEN
    })

    // Si no hay token, usar fallback inmediatamente
    if (!AIRTABLE_TOKEN) {
      console.warn('⚠️ [ATTACH] AIRTABLE_API_KEY o AIRTABLE_TOKEN no configurado, usando fallback')
      const buffer = Buffer.from(await file.arrayBuffer())
      const relativeUrl = fallbackSave(file, buffer)
      return NextResponse.json({ 
        success: true, 
        data: { publicUrl: relativeUrl },
        warning: 'AIRTABLE_API_KEY no está configurado. La imagen se guardó localmente y se enviará como URL a Airtable.'
      })
    }

    // 1. Crear attachment en Airtable (SIEMPRE intentar primero)
    let attachment
    try {
      attachment = await createAirtableAttachment(file.name || 'imagen.png', file.type)
      console.log('🗂️ [ATTACH] createAttachment → attachment.id=', attachment.id)
      console.log('🗂️ [ATTACH] createAttachment → upload_url recibido')
    } catch (error: any) {
      // Capturar el error completo
      const errorMessage = error?.message || String(error)
      const statusMatch = errorMessage.match(/\d{3}/)
      const statusCode = statusMatch ? statusMatch[0] : 'unknown'
      
      console.error('❌ [ATTACH] Error al crear attachment en Airtable:', {
        error: error,
        message: errorMessage,
        status: statusCode
      })
      
      // El endpoint /attachments puede no estar disponible (404) o requerir autenticación especial
      if (statusCode === '404' || errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        console.error('⚠️ [ATTACH] El endpoint /attachments no está disponible (404)')
        console.error('⚠️ [ATTACH] Usando fallback a guardado local')
        
        const buffer = Buffer.from(await file.arrayBuffer())
        const relativeUrl = fallbackSave(file, buffer)
        return NextResponse.json({ 
          success: true, 
          data: { publicUrl: relativeUrl },
          warning: 'El endpoint /attachments de Airtable no está disponible. La imagen se guardó localmente y se enviará como URL a Airtable.'
        })
      }
      
      // Para cualquier otro error (403, 401, etc.), mostrar error detallado
      console.error('❌ [ATTACH] Error no manejado:', errorMessage)
      throw new Error(`No se pudo subir la imagen a Airtable: ${errorMessage}`)
    }

    // 2. Subir binario al upload_url de Airtable
    const arrayBuf = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    
    console.log('⬆️ [ATTACH] Subiendo binario a Airtable:', {
      uploadUrl: attachment.upload_url.substring(0, 50) + '...',
      size: buffer.length
    })
    
    const putRes = await fetch(attachment.upload_url, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    })

    console.log('⬆️ [ATTACH] upload →', putRes.status, putRes.statusText)

    if (!putRes.ok) {
      const text = await putRes.text()
      console.error('❌ [ATTACH] Error al subir binario:', {
        status: putRes.status,
        statusText: putRes.statusText,
        error: text
      })
      throw new Error(`Upload to upload_url failed: ${putRes.status} ${text}`)
    }

    // 3. Devolver attachmentId (éxito)
    console.log('✅ [ATTACH] Imagen subida correctamente a Airtable:', {
      attachmentId: attachment.id
    })
    
    return NextResponse.json({ 
      success: true, 
      data: { attachmentId: attachment.id } 
    })
  } catch (e: any) {
    console.error('❌ [ATTACH] Error:', e)
    return NextResponse.json({ success: false, error: e?.message || 'Upload error' }, { status: 500 })
  }
}

