export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// 👉 Usa la versión REST directa (sin SDK)
const API = "https://api.airtable.com/v0";
const baseId = process.env.AIRTABLE_BASE_ID!;
const token = process.env.AIRTABLE_API_KEY!;
const TABLE_CONTACTOS = process.env.AIRTABLE_TABLE_CONTACTOS || "Contactos";
const TABLE_MENSAJES = process.env.AIRTABLE_TABLE_MENSAJES || "Mensajes";

function headers() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function airtableUpsertByEmail(fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(TABLE_CONTACTOS)}`;
  const body = {
    performUpsert: { fieldsToMergeOn: ["Email"] },
    records: [{ fields }],
  };
  
  console.log('🔍 Upsert request:', { url, body });
  
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  
  console.log('🔍 Upsert response status:', res.status);
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Error al crear/actualizar contacto:", text);
    
    // Si el upsert falla, intentar crear directamente
    console.log('🔄 Intentando crear contacto directamente...');
    return await airtableCreateContacto(fields);
  }
  return res.json();
}

async function airtableCreateContacto(fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(TABLE_CONTACTOS)}`;
  const body = { records: [{ fields }] };
  
  console.log('🔍 Create contacto request:', { url, body });
  
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  
  console.log('🔍 Create contacto response status:', res.status);
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Error al crear contacto:", text);
    throw new Error(`Create contacto falló: ${res.status} ${text}`);
  }
  return res.json();
}

async function airtableCreateMensaje(fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(TABLE_MENSAJES)}`;
  const body = { records: [{ fields }] };
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Error al crear mensaje:", text);
    throw new Error(`Create falló: ${res.status} ${text}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombre = (body?.name ?? body?.nombre ?? "").toString();
    const email = (body?.email ?? "").toString();
    const telefono = (body?.phone ?? body?.telefono ?? "").toString();
    const empresa = (body?.company ?? body?.empresa ?? "").toString();
    const mensaje = (body?.message ?? body?.mensaje ?? "").toString();

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 });
    }

    // 1️⃣ Crear o actualizar contacto
    const contactoFields = {
      Nombre: nombre,
      Email: email,
      ["Teléfono"]: telefono,
      Empresa: empresa,
    };
    const upsertRes = await airtableUpsertByEmail(contactoFields);

    // 2️⃣ Crear mensaje
    const mensajeFields = {
      Nombre: nombre,
      Email: email,
      ["Teléfono"]: telefono,
      Empresa: empresa,
      Mensaje: mensaje,
      Estado: "NUEVO",
    };
    const createRes = await airtableCreateMensaje(mensajeFields);

    const contactoId = upsertRes?.records?.[0]?.id ?? null;
    const mensajeId  = createRes?.records?.[0]?.id ?? null;

    return NextResponse.json({ success: true, contactoId, mensajeId });
  } catch (e: any) {
    console.error("Error en /api/messages:", e);
    return NextResponse.json(
      { error: e.message || "Error interno" },
      { status: 500 }
    );
  }
}
