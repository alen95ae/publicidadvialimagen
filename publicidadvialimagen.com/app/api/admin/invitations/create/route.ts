export const runtime = 'nodejs'

import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/server-auth";
import { createInvitacion } from "@/lib/supabaseInvitaciones";
import { sanitizeEmailForLog } from "@/lib/validation-schemas";

const SITE = process.env.PUBLIC_SITE_URL || "http://localhost:3001";

function nowPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    const user = requireRole(["admin"]); // solo admin crea invitaciones
    const { emails, role = "usuario", expiresDays = 7 } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Debes enviar emails[]" }, { status: 400 });
    }
    if (!["usuario", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    console.log(`[${requestId}] Creando ${emails.length} invitación(es), rol: ${role}`);

    const now = new Date().toISOString();
    const expiresAt = nowPlusDays(expiresDays);
    
    // Crear invitaciones en Supabase
    const links = await Promise.all(
      emails.map(async (raw: string) => {
        const email = (raw || "").trim().toLowerCase();
        const sanitizedEmail = sanitizeEmailForLog(email);
        const token = crypto.randomBytes(24).toString("hex");
        const link = `${SITE}/register?invite=${token}&email=${encodeURIComponent(email)}`;
        
        try {
          const invitacion = await createInvitacion(
            email,
            role,
            token,
            now,
            expiresAt,
            link
          );
          
          return {
            id: invitacion.id,
            email: invitacion.email,
            role,
            link
          };
        } catch (error: any) {
          console.error(`[${requestId}] Error creando invitación para ${sanitizedEmail}:`, error?.message || 'unknown');
          throw error;
        }
      })
    );

    console.log(`[${requestId}] Invitaciones creadas exitosamente: ${links.length}`);
    return NextResponse.json({ success: true, links });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error(`[${requestId}] Error creando invitaciones:`, e?.message || 'unknown');
    return NextResponse.json({ error: "Error creando invitaciones" }, { status: 500 });
  }
}
