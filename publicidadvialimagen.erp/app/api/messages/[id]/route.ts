import { NextResponse } from "next/server";
import { airtable } from "@/lib/airtable";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const record = await airtable("Mensajes").find(params.id);
    
    const data = {
      id: record.id,
      nombre: record.fields.Nombre || "",
      email: record.fields.Email || "",
      telefono: record.fields.Teléfono || "",
      empresa: record.fields.Empresa || "",
      mensaje: record.fields.Mensaje || "",
      fecha_recepcion: record.fields.Fecha || record.createdTime,
      estado: record.fields.Estado || "NUEVO",
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching message from Airtable:", error);
    return NextResponse.json({ error: "Error al obtener mensaje" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const record = await airtable("Mensajes").update(params.id, {
      "Estado": body.estado
    });

    return NextResponse.json({ 
      success: true, 
      id: record.id,
      estado: record.fields.Estado 
    });
  } catch (error) {
    console.error("Error updating message in Airtable:", error);
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await airtable("Mensajes").destroy(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message in Airtable:", error);
    return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 });
  }
}
