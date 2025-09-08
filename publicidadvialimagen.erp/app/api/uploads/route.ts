import { NextResponse } from 'next/server'
import { readdirSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    const dir = join(process.cwd(), 'public', 'uploads')
    
    try { 
      readdirSync(dir) 
    } catch { 
      mkdirSync(dir, { recursive: true }) 
    }
    
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const name = `support_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const rel = `/uploads/${name}`
    
    writeFileSync(join(dir, name), bytes)
    return NextResponse.json({ url: rel })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
