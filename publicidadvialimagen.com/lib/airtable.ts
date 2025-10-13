// lib/airtable.ts
import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY!;
const baseId = process.env.AIRTABLE_BASE_ID!;
const TABLE_CONTACTOS = process.env.AIRTABLE_TABLE_CONTACTOS!;
const TABLE_MENSAJES = process.env.AIRTABLE_TABLE_MENSAJES!;

if (!apiKey || !baseId || !TABLE_CONTACTOS || !TABLE_MENSAJES) {
  throw new Error("Faltan variables AIRTABLE_* en .env.local");
}

export const base = new Airtable({ apiKey }).base(baseId);

// Escapa comillas para fórmulas de Airtable y fuerza a minúsculas
export function sanitizeForFormula(value: string) {
  return value.trim().toLowerCase().replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function findContactByEmail(email: string) {
  console.log('🔍 Buscando contacto con email:', email);
  console.log('🔍 Tabla de contactos:', TABLE_CONTACTOS);
  
  try {
    // Buscar contacto por email usando el campo "Email" (case-insensitive)
    const emailLower = email.trim().toLowerCase();
    const records = await base(TABLE_CONTACTOS)
      .select({
        filterByFormula: `LOWER(TRIM({Email})) = "${emailLower.replace(/"/g, '\\"')}"`,
        maxRecords: 1
      })
      .firstPage();

    console.log('🔍 Registros encontrados:', records.length);
    
    if (records.length > 0) {
      console.log('✅ Contacto existente encontrado:', records[0].id);
      console.log('📋 Campos del contacto:', records[0].fields);
      return records[0];
    }
    
    console.log('❌ No se encontró contacto con ese email');
    return null;
  } catch (error) {
    console.error('❌ Error buscando contacto por email:', error);
    console.error('❌ Error detallado:', error);
    return null;
  }
}

export async function createContact(fields: {
  Nombre?: string;
  Email: string;
  ["Teléfono"]?: string;
  Empresa?: string;
  ["Tipo de Contacto"]?: string; // "Individual" | "Compañía" | ...
  ["Relación"]?: string;         // "Cliente" | "Proveedor" | "Ambos" | ...
  Origen?: string;               // "Formulario" | "Creado" | ...
}) {
  console.log('🆕 Creando contacto con campos:', fields);
  
  // Usar todos los campos disponibles incluyendo Email
  const contactFields: any = {
    Nombre: fields.Nombre || "",
    Email: fields.Email,
    ["Teléfono"]: fields["Teléfono"] || "",
    Empresa: fields.Empresa || "",
    ["Tipo de Contacto"]: fields["Tipo de Contacto"] || "Individual",
    ["Relación"]: fields["Relación"] || "Cliente",
    Origen: [fields.Origen || "FORMULARIO"] // Usar el valor proporcionado o 'FORMULARIO' por defecto (array para selección múltiple)
  };
  
  console.log('🆕 Campos que se van a crear:', contactFields);
  
  const created = await base(TABLE_CONTACTOS).create(
    [
      {
        fields: contactFields,
      },
    ],
    { typecast: true } // ajusta opciones de single select si existen
  );
  console.log('✅ Contacto creado exitosamente:', created[0].id);
  return created[0];
}

export async function createMensaje(fields: {
  Nombre?: string;
  Email: string;
  ["Teléfono"]?: string;
  Empresa?: string;
  Mensaje: string;
  Fecha?: string;
  Estado?: string; // "NUEVO" | "LEÍDO" | "CONTESTADO"...
  // Si más adelante añades un Linked Record "Contacto", podrías pasar: Contacto?: [string];
}) {
  console.log('📝 Creando mensaje con campos:', fields);
  
  // Remover campos que no existen o son computados
  const messageFields: any = {
    Nombre: fields.Nombre || "",
    Email: fields.Email,
    ["Teléfono"]: fields["Teléfono"] || "",
    Empresa: fields.Empresa || "",
    Mensaje: fields.Mensaje,
    Estado: fields.Estado || "NUEVO"
    // No incluir Fecha ya que es computado
  };
  
  console.log('📝 Campos que se van a crear:', messageFields);
  
  const created = await base(TABLE_MENSAJES).create(
    [
      {
        fields: messageFields,
      },
    ],
    { typecast: true }
  );
  console.log('✅ Mensaje creado exitosamente:', created[0].id);
  return created[0];
}
