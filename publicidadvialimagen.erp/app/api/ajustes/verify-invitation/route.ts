import { NextRequest, NextResponse } from "next/server";
import { airtableList, airtableUpdate } from "@/lib/airtable-rest";

const INVITATIONS_TABLE = process.env.AIRTABLE_TABLE_INVITATIONS || "Invitaciones";
const INVITATIONS_TABLE_FALLBACK = "Invitations";

// GET - Verificar invitación
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const email = request.nextUrl.searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ error: "Token y email son requeridos" }, { status: 400 });
    }

    // Buscar la invitación en Airtable
    let invitationData = await (async () => {
      try {
        return await airtableList(INVITATIONS_TABLE, {
          filterByFormula: `AND({Token} = "${token}", {Email} = "${email}", {Estado} = "pendiente")`,
          maxRecords: "1"
        });
      } catch (e: any) {
        if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
          return await airtableList(INVITATIONS_TABLE_FALLBACK, {
            filterByFormula: `AND({Token} = "${token}", {Email} = "${email}", {Estado} = "pendiente")`,
            maxRecords: "1"
          });
        }
        throw e;
      }
    })();

    if (!invitationData.records || invitationData.records.length === 0) {
      return NextResponse.json({ error: "Invitación no encontrada o ya utilizada" }, { status: 404 });
    }

    const invitation = invitationData.records[0];
    const invitationFields = invitation.fields;

    // Verificar si la invitación ha expirado
    const now = new Date();
    const expirationDate = new Date(invitationFields.FechaExpiracion);
    
    if (now > expirationDate) {
      // Marcar como expirada en Airtable
      try {
        await airtableUpdate(INVITATIONS_TABLE, invitation.id, { Estado: "expirado" });
      } catch (e: any) {
        if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
          await airtableUpdate(INVITATIONS_TABLE_FALLBACK, invitation.id, { Estado: "expirado" });
        } else {
          throw e;
        }
      }
      return NextResponse.json({ error: "La invitación ha expirado" }, { status: 410 });
    }

    return NextResponse.json({ 
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitationFields.Email,
        rol: invitationFields.Rol,
        fechaExpiracion: invitationFields.FechaExpiracion
      }
    });
  } catch (error) {
    console.error("Error al verificar invitación:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST - Marcar invitación como usada
export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ error: "Token y email son requeridos" }, { status: 400 });
    }

    // Buscar la invitación en Airtable
    let invitationData = await (async () => {
      try {
        return await airtableList(INVITATIONS_TABLE, {
          filterByFormula: `AND({Token} = "${token}", {Email} = "${email}", {Estado} = "pendiente")`,
          maxRecords: "1"
        });
      } catch (e: any) {
        if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
          return await airtableList(INVITATIONS_TABLE_FALLBACK, {
            filterByFormula: `AND({Token} = "${token}", {Email} = "${email}", {Estado} = "pendiente")`,
            maxRecords: "1"
          });
        }
        throw e;
      }
    })();

    if (!invitationData.records || invitationData.records.length === 0) {
      return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
    }

    const invitation = invitationData.records[0];

    // Marcar como usada en Airtable
    const fechaUso = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD para Airtable
    try {
      await airtableUpdate(INVITATIONS_TABLE, invitation.id, { 
        Estado: "usado",
        FechaUso: fechaUso
      });
    } catch (e: any) {
      if (String(e.message || "").includes("INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND")) {
        await airtableUpdate(INVITATIONS_TABLE_FALLBACK, invitation.id, { 
          Estado: "usado",
          FechaUso: fechaUso
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ message: "Invitación marcada como usada" });
  } catch (error) {
    console.error("Error al marcar invitación como usada:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}