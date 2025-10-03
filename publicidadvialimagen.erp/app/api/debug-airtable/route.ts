import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    const records = await airtable("Soportes").select({}).all()
    
    return NextResponse.json({ 
      totalRecords: records.length,
      records: records.map(r => ({
        id: r.id,
        fields: r.fields,
        createdTime: r.createdTime
      }))
    })
  } catch (e: any) {
    console.error("Error leyendo soportes de Airtable:", e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
