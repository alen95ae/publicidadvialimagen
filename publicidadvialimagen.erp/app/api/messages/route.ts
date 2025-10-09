import { NextResponse } from "next/server";
import { airtable } from "@/lib/airtable";

export async function GET() {
  try {
    const records = await airtable("Mensajes").select({
      sort: [{ field: "Fecha", direction: "desc" }]
    }).all();

    const data = records.map((r: any) => ({
      id: r.id,
      nombre: r.fields.Nombre || "",
      email: r.fields.Email || "",
      telefono: r.fields.Teléfono || "",
      empresa: r.fields.Empresa || "",
      mensaje: r.fields.Mensaje || "",
      fecha_recepcion: r.fields.Fecha || "",
      estado: r.fields.Estado || "NUEVO",
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching messages from Airtable:", error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const record = await airtable("Mensajes").create({
      Nombre: body.name,
      Email: body.email,
      Teléfono: body.phone,
      Empresa: body.company,
      Mensaje: body.message,
      Estado: "NUEVO",
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error("Error creating message in Airtable:", error);
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 });
  }
}
