export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createMensajeSupabase } from "@/lib/supabaseMensajes";

// 👉 Usa la versión REST directa (sin SDK) - Mantenido para compatibilidad
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

    // === Anti-spam lightweight validation ===
    // Fields expected from client: website (honeypot), ts (timestamp), js (flag)
    const website = (body?.website ?? "").toString();
    const js = (body?.js ?? "0").toString();
    const tsRaw = body?.ts;
    const ts = typeof tsRaw === 'number' ? tsRaw : Number(tsRaw);
    const now = Date.now();
    const elapsedMs = Number.isFinite(ts) ? now - ts : 0;

    // Reject if honeypot filled, JS not executed, or submission too fast (< 3000ms)
    // Adjust MIN_SUBMIT_DELAY_MS to tweak the time threshold
    const MIN_SUBMIT_DELAY_MS = 3000;
    if (website.trim() !== "" || js !== "1" || elapsedMs < MIN_SUBMIT_DELAY_MS) {
      return NextResponse.json(
        { error: "Solicitud rechazada" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 });
    }

    // 1️⃣ Guardar mensaje en Supabase (principal)
    let mensajeId: string | null = null
    try {
      console.log('📝 Intentando guardar en Supabase:', { nombre, email, telefono, empresa, mensaje: mensaje.substring(0, 50) + '...' })
      const mensajeSupabase = await createMensajeSupabase({
        nombre: nombre || '',
        email: email,
        telefono: telefono || undefined,
        empresa: empresa || undefined,
        mensaje: mensaje,
        estado: 'NUEVO'
      })
      mensajeId = mensajeSupabase.id || null
      console.log('✅ Mensaje guardado en Supabase:', mensajeId)
    } catch (error: any) {
      console.error('❌ Error guardando en Supabase:', error)
      console.error('❌ Error details:', error.message)
      console.error('❌ Error stack:', error.stack)
      // Si falla Supabase, lanzar el error para que se vea en el response
      return NextResponse.json(
        { 
          error: "Error al guardar formulario en Supabase", 
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      )
    }

    // 2️⃣ Fallback: Crear o actualizar contacto en Airtable (opcional, para compatibilidad)
    let contactoId: string | null = null
    try {
      const contactoFields = {
        Nombre: nombre,
        Email: email,
        ["Teléfono"]: telefono,
        Empresa: empresa,
      };
      const upsertRes = await airtableUpsertByEmail(contactoFields);
      contactoId = upsertRes?.records?.[0]?.id ?? null;
    } catch (error: any) {
      console.error('⚠️ Error en Airtable (no crítico):', error)
    }

    // 3️⃣ Fallback: Crear mensaje en Airtable (opcional, para compatibilidad)
    let mensajeAirtableId: string | null = null
    if (!mensajeId) {
      try {
        const mensajeFields = {
          Nombre: nombre,
          Email: email,
          ["Teléfono"]: telefono,
          Empresa: empresa,
          Mensaje: mensaje,
          Estado: "NUEVO",
        };
        const createRes = await airtableCreateMensaje(mensajeFields);
        mensajeAirtableId = createRes?.records?.[0]?.id ?? null;
      } catch (error: any) {
        console.error('⚠️ Error creando mensaje en Airtable (no crítico):', error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      mensajeId: mensajeId || mensajeAirtableId,
      contactoId,
      source: mensajeId ? 'supabase' : 'airtable'
    });
  } catch (e: any) {
    console.error("❌ Error en /api/messages:", e);
    console.error("❌ Error message:", e.message);
    console.error("❌ Error stack:", e.stack);
    return NextResponse.json(
      { 
        error: e.message || "Error interno",
        details: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      },
      { status: 500 }
    );
  }
}
