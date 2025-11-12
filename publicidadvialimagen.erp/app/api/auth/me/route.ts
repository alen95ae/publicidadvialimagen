export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { airtableGet } from "@/lib/airtable-rest";

const USERS_TABLE = process.env.AIRTABLE_TABLE_USERS || "Users";

export async function GET() {
  try {
    const token = cookies().get("session")?.value;
    if (!token) return NextResponse.json({ user: null });
    const payload = await verifySession(token);
    
    // Siempre obtener el nombre desde Airtable para tener la información más actualizada
    let userName = "";
    try {
      const userRecord = await airtableGet(USERS_TABLE, payload.sub);
      userName = userRecord.fields?.Nombre || userRecord.fields?.Name || "";
      console.log("User name from Airtable:", userName, "for user ID:", payload.sub);
    } catch (error) {
      console.error("Error fetching user from Airtable:", error);
      // Fallback al nombre del token si falla Airtable
      userName = payload.name || "";
    }
    
    return NextResponse.json({ 
      user: { 
        id: payload.sub, 
        email: payload.email, 
        role: payload.role, 
        name: userName || payload.email || "Usuario"
      } 
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ user: null });
  }
}
