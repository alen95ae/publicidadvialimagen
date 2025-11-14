import { NextResponse } from "next/server";
import { messagesService } from "@/lib/messages";

export async function GET() {
  try {
    console.log("🔍 GET /api/messages - Iniciando consulta a Supabase");

    const mensajes = await messagesService.getMessages();

    console.log(`✅ Se obtuvieron ${mensajes.length} mensajes de Supabase`);

    return NextResponse.json(mensajes);
  } catch (error) {
    console.error("❌ Error fetching messages from Supabase:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: "Error al obtener mensajes", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
