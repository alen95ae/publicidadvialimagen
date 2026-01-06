export const runtime = 'nodejs'
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createMensajeSupabase } from "@/lib/supabaseMensajes";
import { validateCriticalEndpoint } from "@/lib/api-protection";
import { messagesSchema, sanitizeEmailForLog } from "@/lib/validation-schemas";
import { sanitizeText } from "@/lib/sanitize";

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
  
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Error al crear/actualizar contacto en Airtable");
    
    // Si el upsert falla, intentar crear directamente
    return await airtableCreateContacto(fields);
  }
  return res.json();
}

async function airtableCreateContacto(fields: Record<string, any>) {
  const url = `${API}/${baseId}/${encodeURIComponent(TABLE_CONTACTOS)}`;
  const body = { records: [{ fields }] };
  
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error("Error al crear contacto en Airtable");
    throw new Error(`Create contacto falló: ${res.status}`);
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
  // 1. Validación de protección contra bots (ANTES de parsear body)
  const protection = validateCriticalEndpoint(req as NextRequest, false);
  if (!protection.allowed) {
    return protection.response!;
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`[${requestId}] Mensaje recibido`);

  try {
    const body = await req.json();

    // Validación robusta con Zod (incluye validación anti-spam)
    const validationResult = messagesSchema.safeParse(body);
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validación fallida:`, validationResult.error.errors[0]?.message);
      return NextResponse.json(
        { 
          error: validationResult.error.errors[0]?.message || "Datos inválidos",
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      );
    }

    const { nombre, email, telefono, empresa, mensaje, website, js, ts } = validationResult.data;

    // Validación anti-spam adicional (después de Zod)
    const now = Date.now();
    const elapsedMs = ts ? now - ts : 0;
    const MIN_SUBMIT_DELAY_MS = 3000;
    
    if (website.trim() !== "" || js !== "1" || elapsedMs < MIN_SUBMIT_DELAY_MS) {
      console.warn(`[${requestId}] Solicitud rechazada por anti-spam`);
      return NextResponse.json(
        { error: "Solicitud rechazada" },
        { status: 400 }
      );
    }

    // Sanitización XSS: eliminar HTML y atributos peligrosos de campos de texto libre
    // Aplicar DESPUÉS de validar con Zod y ANTES de guardar en BD
    const nombreSanitizado = sanitizeText(nombre);
    const empresaSanitizada = empresa ? sanitizeText(empresa) : undefined;
    const mensajeSanitizado = sanitizeText(mensaje);
    // NO sanitizar: email, telefono (tienen formato específico validado por Zod)

    // 1️⃣ Guardar mensaje en Supabase (principal)
    let mensajeId: string | null = null
    try {
      console.log(`[${requestId}] Guardando en Supabase`);
      const mensajeSupabase = await createMensajeSupabase({
        nombre: nombreSanitizado,
        email: email,
        telefono: telefono || undefined,
        empresa: empresaSanitizada,
        mensaje: mensajeSanitizado,
        estado: 'NUEVO'
      })
      mensajeId = mensajeSupabase.id || null
      console.log(`[${requestId}] Mensaje guardado: ${mensajeId}`)
    } catch (error: any) {
      console.error(`[${requestId}] Error guardando en Supabase:`, error?.message || 'unknown');
      return NextResponse.json(
        { 
          error: "Error al guardar formulario en Supabase", 
          details: error.message
        },
        { status: 500 }
      )
    }

    // 2️⃣ Fallback: Crear o actualizar contacto en Airtable (opcional, para compatibilidad)
    let contactoId: string | null = null
    try {
      const contactoFields = {
        Nombre: nombreSanitizado,
        Email: email,
        ["Teléfono"]: telefono,
        Empresa: empresaSanitizada || empresa,
      };
      const upsertRes = await airtableUpsertByEmail(contactoFields);
      contactoId = upsertRes?.records?.[0]?.id ?? null;
    } catch (error: any) {
      console.warn(`[${requestId}] Error en Airtable (no crítico)`);
    }

    // 3️⃣ Fallback: Crear mensaje en Airtable (opcional, para compatibilidad)
    let mensajeAirtableId: string | null = null
    if (!mensajeId) {
      try {
        const mensajeFields = {
          Nombre: nombreSanitizado,
          Email: email,
          ["Teléfono"]: telefono,
          Empresa: empresaSanitizada || empresa,
          Mensaje: mensajeSanitizado,
          Estado: "NUEVO",
        };
        const createRes = await airtableCreateMensaje(mensajeFields);
        mensajeAirtableId = createRes?.records?.[0]?.id ?? null;
      } catch (error: any) {
        console.warn(`[${requestId}] Error creando mensaje en Airtable (no crítico)`);
      }
    }

    console.log(`[${requestId}] Mensaje procesado exitosamente`);
    return NextResponse.json({ 
      success: true, 
      mensajeId: mensajeId || mensajeAirtableId,
      contactoId,
      source: mensajeId ? 'supabase' : 'airtable'
    });
  } catch (e: any) {
    console.error(`[${requestId}] Error en /api/messages:`, e?.message || 'unknown');
    return NextResponse.json(
      { 
        error: e.message || "Error interno",
        details: e.message
      },
      { status: 500 }
    );
  }
}
