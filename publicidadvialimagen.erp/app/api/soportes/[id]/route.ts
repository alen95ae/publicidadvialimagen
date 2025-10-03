import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"
import { buildPayload, rowToSupport } from "../helpers"

export async function GET(_:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    const { id } = await params
    const response = await airtable("Soportes").select({
      filterByFormula: `RECORD_ID() = '${id}'`
    }).all()
    
    if (!response || response.length === 0) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    const record = response[0]
    return NextResponse.json(rowToSupport({ id: record.id, ...record.fields }))
  }catch(e){
    console.error('GET soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}

export async function PUT(req:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    const { id } = await params
    const body = await req.json()
    console.log('📝 PUT /api/soportes/[id] - Recibido body:', JSON.stringify(body, null, 2))
    
    if (!body.code || !body.title) {
      return NextResponse.json({ error:"Código y título son requeridos" }, { status:400 })
    }
    
    const response = await airtable("Soportes").select({
      filterByFormula: `RECORD_ID() = '${id}'`
    }).all()
    
    if (!response || response.length === 0) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    const existing = response[0]
    const payload = buildPayload(body, existing.fields)
    console.log('📤 Payload a enviar a Airtable:', JSON.stringify(payload, null, 2))
    
    const updated = await airtable("Soportes").update(id, payload)
    console.log('✅ Soporte actualizado en Airtable')
    
    return NextResponse.json(rowToSupport({ id: updated.id, ...updated.fields }))
  }catch(e){
    console.error('❌ PUT soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}

export async function DELETE(_:Request,{ params }:{ params:Promise<{id:string}> }) {
  try{
    const { id } = await params
    const response = await airtable("Soportes").select({
      filterByFormula: `RECORD_ID() = '${id}'`
    }).all()
    
    if (!response || response.length === 0) {
      return NextResponse.json({ error:"Soporte no encontrado" }, { status:404 })
    }
    
    await airtable("Soportes").destroy(id)
    return NextResponse.json({ ok:true })
  }catch(e){
    console.error('DELETE soporte exception:', e)
    return NextResponse.json({ error:"Error interno del servidor" }, { status:500 })
  }
}
