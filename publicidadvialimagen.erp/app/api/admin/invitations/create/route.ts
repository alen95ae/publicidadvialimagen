import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/server-auth";
import { airtableCreate } from "@/lib/airtable-rest";

const TABLE = process.env.AIRTABLE_TABLE_INVITACIONES || "Invitaciones";
const SITE = process.env.PUBLIC_SITE_URL || "http://localhost:3000";

function nowPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export async function POST(req: Request) {
  try {
    const user = requireRole(["admin"]); // solo admin crea invitaciones
    const { emails, role = "usuario", expiresDays = 7 } = await req.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Debes enviar emails[]" }, { status: 400 });
    }
    if (!["usuario", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const records = emails.map((raw: string) => {
      const email = (raw || "").trim().toLowerCase();
      const token = crypto.randomBytes(24).toString("hex");
      const link = `${SITE}/register?invite=${token}&email=${encodeURIComponent(email)}`;
      return {
        fields: {
          Email: email,
          Role: role,
          Token: token,
          ExpiresAt: nowPlusDays(expiresDays),
          Accepted: false,
          Revoked: false,
          CreatedBy: user.email || "",
        },
      };
    });

    const res = await airtableCreate(TABLE, records);
    // Devolver los links generados
    const links = res.records.map((r: any, i: number) => ({
      id: r.id,
      email: records[i].fields.Email,
      role,
      link: `${SITE}/register?invite=${records[i].fields.Token}&email=${encodeURIComponent(records[i].fields.Email)}`
    }));

    return NextResponse.json({ success: true, links });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error("invite create error:", e);
    return NextResponse.json({ error: "Error creando invitaciones" }, { status: 500 });
  }
}
