export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { updateInvitacion } from "@/lib/supabaseInvitaciones";

export async function POST(req: Request) {
  try {
    requireRole(["admin"]);
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
    
    const updated = await updateInvitacion(id, { estado: 'revocado' });
    if (!updated) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error("invite revoke error:", e);
    return NextResponse.json({ error: "Error revocando" }, { status: 500 });
  }
}
