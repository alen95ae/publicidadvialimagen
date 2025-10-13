import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server-auth";
import { airtableList } from "@/lib/airtable-rest";

const TABLE = process.env.AIRTABLE_TABLE_INVITACIONES || "Invitaciones";

export async function GET() {
  try {
    requireRole(["admin"]);
    const data = await airtableList(TABLE, { pageSize: "50" });
    return NextResponse.json({ records: data.records });
  } catch (e: any) {
    if (e?.code === "FORBIDDEN") return NextResponse.json({ error: "Solo admin" }, { status: 403 });
    console.error("invite list error:", e);
    return NextResponse.json({ error: "Error listando invitaciones" }, { status: 500 });
  }
}
