export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { messagesService } from "@/lib/messages";
import { getAllSolicitudes } from "@/lib/supabaseSolicitudes";

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

    // Obtener solicitudes nuevas (estado Nueva) desde Supabase
    let solicitudes: any[] = [];
    try {
      const allSolicitudes = await getAllSolicitudes();
      console.log(`📊 [NOTIFICACIONES] Solicitudes obtenidas de BD: ${allSolicitudes.length}`);
      
      // Filtrar solo las que tienen estado EXACTAMENTE "Nueva"
      const solicitudesNuevas = allSolicitudes.filter((s) => {
        const estado = s.estado?.trim();
        const esNueva = estado === "Nueva";
        if (!esNueva && estado) {
          console.log(`⚠️ [NOTIFICACIONES] Solicitud ${s.codigo} tiene estado "${estado}" (no es "Nueva")`);
        }
        return esNueva;
      });
      
      console.log(`📊 [NOTIFICACIONES] Solicitudes con estado "Nueva": ${solicitudesNuevas.length}`);
      
      solicitudes = solicitudesNuevas
        .slice(0, 10)
        .map((s) => ({
          id: s.id || s.codigo,
          codigo: s.codigo,
          type: "solicitud" as const,
          titulo: `Nueva solicitud de ${s.empresa || "Sin empresa"}`,
          mensaje: s.comentarios || "",
          fecha: s.fechaCreacion || new Date().toISOString(),
          link: `/panel/ventas/solicitudes/${s.codigo}`,
        }));
      console.log(`✅ [NOTIFICACIONES] Solicitudes nuevas procesadas: ${solicitudes.length}`);
    } catch (error) {
      console.error("❌ [NOTIFICACIONES] Error fetching solicitudes from Supabase:", error);
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

