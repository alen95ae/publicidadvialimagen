export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { messagesService } from "@/lib/messages";
import { airtableList } from "@/lib/airtable-rest";

export async function GET() {
  try {
    // Obtener mensajes nuevos (estado NUEVO) desde Supabase
    let mensajes: any[] = [];
    try {
      const allMensajes = await messagesService.getMessages();
      
      // Filtrar solo los mensajes con estado NUEVO
      const mensajesNuevos = allMensajes
        .filter((m) => m.estado === "NUEVO")
        .slice(0, 10); // Máximo 10

      mensajes = mensajesNuevos.map((m) => ({
        id: m.id,
        type: "mensaje" as const,
        titulo: `Nuevo mensaje de ${m.nombre || "Sin nombre"}`,
        mensaje: m.mensaje || "",
        fecha: m.fecha_recepcion || m.created_at || new Date().toISOString(),
        link: `/panel/mensajes/${m.id}`,
      }));
      
      console.log(`✅ Notificaciones: ${mensajes.length} mensajes nuevos desde Supabase`);
    } catch (error) {
      console.error("Error fetching messages from Supabase:", error);
    }

    // Obtener solicitudes nuevas (estado Nueva)
    let solicitudes: any[] = [];
    try {
      const solicitudesData = await airtableList("Solicitudes");
      solicitudes = (solicitudesData.records || [])
        .filter((record: any) => {
          const estado = record.fields?.["Estado"] || "";
          return estado === "Nueva" || estado === "";
        })
        .slice(0, 10)
        .map((record: any) => {
          const codigo = record.fields?.["Código"] || record.id;
          return {
            id: record.id, // ID de Airtable para tracking
            codigo: codigo, // Código para la URL
            type: "solicitud" as const,
            titulo: `Nueva solicitud de ${record.fields?.["Empresa"] || "Sin empresa"}`,
            mensaje: record.fields?.["Comentarios"] || "",
            fecha: record.fields?.["Fecha Creación"] || record.createdTime,
            link: `/panel/ventas/solicitudes/${codigo}`,
          };
        });
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    }

    // Combinar y ordenar por fecha
    const notificaciones = [...mensajes, ...solicitudes].sort((a, b) => {
      const fechaA = new Date(a.fecha).getTime();
      const fechaB = new Date(b.fecha).getTime();
      return fechaB - fechaA;
    });

    return NextResponse.json({
      notificaciones: notificaciones.slice(0, 10), // Máximo 10 notificaciones
      total: mensajes.length + solicitudes.length,
      mensajes: mensajes.length,
      solicitudes: solicitudes.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        notificaciones: [],
        total: 0,
        mensajes: 0,
        solicitudes: 0,
        error: "Error al obtener notificaciones",
      },
      { status: 500 }
    );
  }
}

