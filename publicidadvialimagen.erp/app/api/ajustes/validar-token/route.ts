import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/auth/jwt";
import { airtableList, airtableUpdate } from "@/lib/airtable-rest";

const INVITATIONS_TABLE = process.env.AIRTABLE_TABLE_INVITATIONS || "Invitaciones";

// GET /api/ajustes/validar-token - Validar token de invitación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Verificar el JWT
    let payload;
    try {
      payload = await verify(token);
    } catch (error) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    // Verificar que el token no haya expirado
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return NextResponse.json({ error: "Token expirado" }, { status: 400 });
    }

    // Buscar la invitación en Airtable
    const invitation = await airtableList(INVITATIONS_TABLE, {
      filterByFormula: `{Token} = "${token}"`,
      maxRecords: "1",
    });

    if (invitation.records.length === 0) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    const invitationRecord = invitation.records[0];
    const estado = invitationRecord.fields.Estado;

    if (estado === "usado") {
      return NextResponse.json({ error: "Esta invitación ya ha sido utilizada" }, { status: 400 });
    }

    if (estado === "expirado") {
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
    }

    // Verificar fecha de expiración
    const fechaExpiracion = new Date(invitationRecord.fields.FechaExpiracion);
    if (fechaExpiracion < new Date()) {
      // Marcar como expirado
      await airtableUpdate(INVITATIONS_TABLE, invitationRecord.id, {
        Estado: "expirado"
      });
      return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
    }

    return NextResponse.json({
      valido: true,
      email: invitationRecord.fields.Email,
      rol: invitationRecord.fields.Rol,
      fechaExpiracion: invitationRecord.fields.FechaExpiracion,
    });
  } catch (error) {
    console.error("Error validating token:", error);
    return NextResponse.json({ error: "Error al validar token" }, { status: 500 });
  }
}

// POST /api/ajustes/validar-token - Usar token (marcar como usado)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Buscar la invitación
    const invitation = await airtableList(INVITATIONS_TABLE, {
      filterByFormula: `{Token} = "${token}"`,
      maxRecords: "1",
    });

    if (invitation.records.length === 0) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    const invitationRecord = invitation.records[0];

    // Marcar como usado
    await airtableUpdate(INVITATIONS_TABLE, invitationRecord.id, {
      Estado: "usado",
      FechaUso: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      email: invitationRecord.fields.Email,
      rol: invitationRecord.fields.Rol,
    });
  } catch (error) {
    console.error("Error using token:", error);
    return NextResponse.json({ error: "Error al usar token" }, { status: 500 });
  }
}
