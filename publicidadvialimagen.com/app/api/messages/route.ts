import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar que todos los campos requeridos estén presentes
    const requiredFields = ['name', 'email', 'phone', 'company', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ 
          error: `Campo requerido faltante: ${field}` 
        }, { status: 400 });
      }
    }

    // Verificar variables de entorno
    if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_MESSAGES_TABLE || !process.env.AIRTABLE_API_KEY) {
      console.error('Missing Airtable environment variables');
      return NextResponse.json({ 
        error: "Error de configuración del servidor. Por favor, contacta al administrador." 
      }, { status: 500 });
    }

    console.log('Sending to Airtable:', {
      baseId: process.env.AIRTABLE_BASE_ID,
      table: process.env.AIRTABLE_MESSAGES_TABLE,
      fields: {
        Nombre: body.name,
        Email: body.email,
        Teléfono: body.phone,
        Empresa: body.company,
        Mensaje: body.message,
        Estado: "NUEVO",
      }
    });

    // Enviar a Airtable
    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_MESSAGES_TABLE}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Nombre: body.name,
            Email: body.email,
            Teléfono: body.phone,
            Empresa: body.company,
            Mensaje: body.message,
            Estado: "NUEVO",
          },
        }),
      }
    );

    if (!airtableRes.ok) {
      const errorData = await airtableRes.text();
      console.error('Airtable API error:', {
        status: airtableRes.status,
        statusText: airtableRes.statusText,
        error: errorData
      });
      
      // Proporcionar mensajes de error más específicos
      if (airtableRes.status === 404) {
        return NextResponse.json({ 
          error: "La tabla de mensajes no existe en Airtable. Por favor, contacta al administrador." 
        }, { status: 500 });
      } else if (airtableRes.status === 401) {
        return NextResponse.json({ 
          error: "Error de autenticación con Airtable. Por favor, contacta al administrador." 
        }, { status: 500 });
      } else {
        return NextResponse.json({ 
          error: `Error de Airtable (${airtableRes.status}): ${errorData}` 
        }, { status: 500 });
      }
    }

    const result = await airtableRes.json();
    console.log('Airtable response:', result);

    return NextResponse.json({ 
      success: true, 
      message: "Mensaje enviado exitosamente",
      id: result.id 
    });

  } catch (error: any) {
    console.error("Error creating message in Airtable:", error);
    return NextResponse.json({ 
      error: `Error al enviar el mensaje: ${error.message}` 
    }, { status: 500 });
  }
}
