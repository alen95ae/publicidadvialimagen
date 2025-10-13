import { NextResponse } from "next/server";
import { createUser, findUserByEmail, signSession, setSessionCookie } from "@/lib/auth";
import { airtableList, airtableUpdate } from "@/lib/airtable-rest";

const TABLE_INV = process.env.AIRTABLE_TABLE_INVITACIONES || "Invitaciones";

function nowISO() { return new Date().toISOString(); }

export async function POST(req: Request) {
  try {
    const { email, password, name, inviteToken } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }

    let assignedRole = "invitado";
    let invRecordId: string | null = null;

    if (inviteToken) {
      const lower = email.trim().toLowerCase().replace(/'/g, "\\'");
      const token = inviteToken.replace(/'/g, "\\'");
      const data = await airtableList(TABLE_INV, {
        filterByFormula: `AND(
          LOWER({Email})='${lower}',
          {Token}='${token}',
          NOT({Revoked}),
          NOT({Accepted})
        )`,
        maxRecords: "1",
        pageSize: "1",
      });
      const rec = data?.records?.[0];
      if (rec) {
        const expires = rec.fields?.["ExpiresAt"] as string | undefined;
        const role = rec.fields?.["Role"] as string | undefined;
        if (role && (!expires || new Date(expires) > new Date())) {
          assignedRole = role; // "usuario" o "admin"
          invRecordId = rec.id;
        }
      }
    }

    const user = await createUser(email, password, name);
    console.log("User created:", user);
    console.log("User role:", user.fields.Rol);
    
    // Sobrescribir rol si invitación válida
    if (assignedRole !== "invitado") {
      console.log("Updating role to:", assignedRole);
      await airtableUpdate(process.env.AIRTABLE_TABLE_USERS || "Usuarios", user.id, { Rol: assignedRole });
    }

    if (invRecordId) {
      await airtableUpdate(TABLE_INV, invRecordId, { Accepted: true, UsedAt: nowISO() });
    }

    const token = await signSession({ id: user.id, email: user.fields.Email, role: assignedRole, name: user.fields.Nombre });
    await setSessionCookie(token);

    // Redirección por rol
    const redirect = (assignedRole === "usuario" || assignedRole === "admin") ? "/panel" : "/panel";

    return NextResponse.json({ success: true, user: { id: user.id, email: user.fields.Email, name: user.fields.Nombre, role: assignedRole }, redirect });
  } catch (e: any) {
    console.error("register error:", e);
    return NextResponse.json({ error: "Error en registro" }, { status: 500 });
  }
}