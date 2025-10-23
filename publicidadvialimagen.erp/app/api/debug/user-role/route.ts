import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    const payload = await verifySession(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name
      },
      canAccessAjustes: payload.role === "admin"
    });
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json({ error: "Error getting user role" }, { status: 500 });
  }
}
