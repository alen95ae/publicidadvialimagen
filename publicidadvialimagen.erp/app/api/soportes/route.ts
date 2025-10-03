import { NextResponse } from "next/server"
import { airtable } from "@/lib/airtable"

export async function GET() {
  try {
    const records = await airtable("Soportes").select({}).all()
    
    // Debug: ver qué campos están llegando de Airtable
    console.log("Records from Airtable:", records.length)
    if (records.length > 0) {
      console.log("First record fields:", records[0].fields)
      console.log("Available field names:", Object.keys(records[0].fields))
    }

    const data = records.map((r) => ({
      id: r.id,
      code: r.fields["Código"] || "",
      title: r.fields["Título"] || "",
      type: r.fields["Tipo de soporte"] || "Vallas Publicitarias",
      status: (r.fields["Estado"] || "DISPONIBLE").toUpperCase(), // Convertir a mayúsculas para coincidir con STATUS_META
      widthM: r.fields["Ancho"] || 0,
      heightM: r.fields["Alto"] || 0,
      city: r.fields["Ciudad"] || "",
      priceMonth: r.fields["Precio por mes"] || 0,
      impactosDiarios: r.fields["Impactos diarios"] || 0,
      googleMapsLink: r.fields["Enlace Google Maps"] || "",
      address: r.fields["Dirección / Notas"] || "",
      owner: r.fields["Propietario"] || "",
      available: (r.fields["Estado"] || "").toUpperCase() === "DISPONIBLE",
      createdAt: r.createdTime,
      updatedAt: r.fields["Última actualización"] || r.createdTime
    }))

    return NextResponse.json({ data })
  } catch (e: any) {
    console.error("Error leyendo soportes de Airtable:", e)
    return NextResponse.json({ error: "No se pudieron obtener los soportes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.code || !body.title) {
      return NextResponse.json({ error: "Código y título son requeridos" }, { status: 400 })
    }
    
    // Construir payload con los nombres correctos de Airtable
    const payload = buildPayload(body)
    
    // Crear nuevo soporte en Airtable
    const record = await airtable("Soportes").create([{ fields: payload }])

    return NextResponse.json(rowToSupport({ 
      id: record[0].id,
      ...record[0].fields 
    }), { status: 201 })
  } catch (e: any) {
    console.error("Error creando soporte en Airtable:", e)
    return NextResponse.json({ error: "No se pudo crear el soporte" }, { status: 500 })
  }
}
