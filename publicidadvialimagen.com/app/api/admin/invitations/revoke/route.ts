import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { airtableUpdate } from "@/lib/airtable-rest";

const TABLE = process.env.AIRTABLE_TABLE_INVITACIONES || "Invitaciones";

export async function POST(req: Request) {
  try {
    requireRole(["admin"]);
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
    await airtableUpdate(TABLE, id, { Revoked: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error("invite revoke error:", e);
    return NextResponse.json({ error: "Error revocando" }, { status: 500 });
  }
}
