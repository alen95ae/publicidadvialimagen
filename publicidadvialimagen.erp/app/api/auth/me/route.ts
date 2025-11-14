export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { getUserByIdSupabase } from "@/lib/supabaseUsers";

export async function GET() {
  try {
    const token = cookies().get("session")?.value;
    if (!token) return NextResponse.json({ user: null });
    const payload = await verifySession(token);
    
    // Obtener el nombre desde Supabase para tener la información más actualizada
    let userName = "";
    try {
      const userRecord = await getUserByIdSupabase(payload.sub);
      userName = userRecord?.fields?.Nombre || "";
      console.log("User name from Supabase:", userName, "for user ID:", payload.sub);
    } catch (error) {
      console.error("Error fetching user from Supabase:", error);
      // Fallback al nombre del token si falla Supabase
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
