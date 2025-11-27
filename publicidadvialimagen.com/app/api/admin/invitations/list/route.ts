export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { getAllInvitaciones } from "@/lib/supabaseInvitaciones";

export async function GET() {
  try {
    requireRole(["admin"]);
    const invitaciones = await getAllInvitaciones();
    
    // Transformar al formato esperado por el frontend (compatible con Airtable)
    const records = invitaciones.map(inv => ({
      id: inv.id,
      fields: {
        Email: inv.email,
        Role: inv.rol,
        Token: inv.token,
        ExpiresAt: inv.fechaExpiracion,
        Accepted: inv.estado === 'usado',
        Revoked: inv.estado === 'revocado',
        CreatedBy: '', // Campo no disponible en Supabase actualmente
      }
    }));
    
    return NextResponse.json({ records });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error("invite list error:", e);
    return NextResponse.json({ error: "Error listando invitaciones" }, { status: 500 });
  }
}
