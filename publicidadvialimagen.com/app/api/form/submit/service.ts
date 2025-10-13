// app/api/form/submit/service.ts
import { createMensaje, createContact, findContactByEmail } from "@/lib/airtable";

type Payload = {
  nombre?: string;
  email: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
};

export async function createContactoYMensaje(p: Payload) {
  console.log('  🔍 Service: Formulario recibido:', p);
  
  try {
    // 1) Buscar contacto por email
    console.log('  🔍 Service: Buscando contacto existente con email:', p.email);
    const existing = await findContactByEmail(p.email);
    console.log('  🔍 Service: Contacto existente encontrado:', existing ? 'SÍ (ID: ' + existing.id + ')' : 'NO');

    let contactoId: string | null = null;

    if (existing) {
      contactoId = existing.id;
      console.log('  ✅ Service: Usando contacto existente:', contactoId);
    } else {
      console.log('  🆕 Service: Creando nuevo contacto...');
      console.log('  🆕 Service: Datos del contacto:', {
        Nombre: p.nombre || "",
        Email: p.email,
        Teléfono: p.telefono || "",
        Empresa: p.empresa || "",
      });
      
      // 2) Crear contacto si no existe
      const nuevo = await createContact({
        Nombre: p.nombre || "",
        Email: p.email,
        ["Teléfono"]: p.telefono || "",
        Empresa: p.empresa || "",
        ["Tipo de Contacto"]: "Individual",
        ["Relación"]: "Cliente",
        Origen: ["FORMULARIO"] // Asignar 'FORMULARIO' para contactos creados desde formularios web (array para selección múltiple)
      });
      contactoId = nuevo.id;
      console.log('  ✅ Service: Nuevo contacto creado exitosamente!');
      console.log('  ✅ Service: ID del contacto:', contactoId);
      console.log('  ✅ Service: Campos del contacto:', nuevo.fields);
    }

    // 3) Crear mensaje SIEMPRE
    console.log('  📝 Service: Creando mensaje...');
    const createdMsg = await createMensaje({
      Nombre: p.nombre || "",
      Email: p.email,
      ["Teléfono"]: p.telefono || "",
      Empresa: p.empresa || "",
      Mensaje: p.mensaje,
      Estado: "NUEVO"
      // No incluir Fecha ya que es computado en Airtable
      // Si añades un Linked Record en "Mensajes" llamado "Contacto", descomenta:
      // Contacto: [contactoId],
    });
    console.log('  ✅ Service: Mensaje creado exitosamente!');
    console.log('  ✅ Service: ID del mensaje:', createdMsg.id);

    return { contactoId, mensajeId: createdMsg.id };
  } catch (error: any) {
    console.error('  ❌❌❌ Service: Error en createContactoYMensaje:', error);
    console.error('  ❌ Service: Error message:', error.message);
    console.error('  ❌ Service: Error stack:', error.stack);
    throw error;
  }
}
