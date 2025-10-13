// app/api/form/simple/service.ts
import { airtableCreate, airtableUpsertByEmail } from "@/lib/airtable-rest"

const CONTACTOS = process.env.AIRTABLE_TABLE_CONTACTOS!
const MENSAJES = process.env.AIRTABLE_TABLE_MENSAJES!

type Payload = {
  nombre?: string
  email: string
  telefono?: string
  empresa?: string
}

export async function saveToAirtableSimple(p: Payload) {
  const fields = {
    Nombre: p.nombre || "",
    Email: p.email,
    ["Teléfono"]: p.telefono || "",
    Empresa: p.empresa || "",
    Origen: ["FORMULARIO"] // Asignar 'FORMULARIO' para contactos creados desde formularios web (array para selección múltiple)
  }

  // 1) UPSERT en Contactos (merge por Email)
  let contactoId: string | null = null
  try {
    const upsertRes = await airtableUpsertByEmail(CONTACTOS, fields)
    contactoId = upsertRes?.records?.[0]?.id ?? null
  } catch (e: any) {
    console.error("[Contactos Upsert] Error:", e?.message || e)
  }

  // Fallback: si no hubo id (por cualquier motivo), intentar CREATE explícito
  if (!contactoId) {
    try {
      const createContacto = await airtableCreate(CONTACTOS, [{ fields }])
      contactoId = createContacto?.records?.[0]?.id ?? null
    } catch (e: any) {
      console.error("[Contactos Create Fallback] Error:", e?.message || e)
    }
  }

  // 2) CREATE en Mensajes (siempre)
  const createRes = await airtableCreate(MENSAJES, [{ fields }])

  const mensajeId = createRes?.records?.[0]?.id ?? null

  return { contactoId, mensajeId }
}


