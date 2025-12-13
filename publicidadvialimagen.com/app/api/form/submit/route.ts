// app/api/form/submit/route.ts
import { NextResponse } from "next/server";
import { createContactoYMensaje } from "./service";

export async function POST(req: Request) {
  console.log('\n🔥 ===== FORMULARIO RECIBIDO =====');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    const body = await req.json();
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));

    // Aceptar tanto formato español como inglés para compatibilidad
    const nombre = (body?.nombre || body?.name || "").toString();
    const email = (body?.email || "").toString();
    const telefono = (body?.telefono || body?.phone || "").toString();
    const empresa = (body?.empresa || body?.company || "").toString();
    const mensaje = (body?.mensaje || body?.message || "").toString();

    console.log('📋 Datos procesados:', { nombre, email, telefono, empresa, mensaje });

    if (!email || !mensaje) {
      console.log('❌ Validación fallida: falta email o mensaje');
      console.log('❌ Email recibido:', email);
      console.log('❌ Mensaje recibido:', mensaje);
      return NextResponse.json(
        { success: false, error: "Email y Mensaje son obligatorios" },
        { status: 400 }
      );
    }

    console.log('✅ Validación OK, llamando a createContactoYMensaje...');
    
    // Separar lógica de formulario de notificaciones
    // El formulario DEBE guardarse incluso si falla la notificación
    let result;
    try {
      result = await createContactoYMensaje({
        nombre,
        email,
        telefono,
        empresa,
        mensaje,
      });
      console.log('✅ Resultado:', result);
    } catch (formError: any) {
      // Error al guardar el formulario - esto SÍ debe fallar
      console.error("❌❌❌ Form submit error (guardando formulario):", formError);
      console.error("Error details:", formError.message);
      console.error("Error stack:", formError.stack);
      console.log('🔥 ===== FIN FORMULARIO (ERROR) =====\n');
      return NextResponse.json(
        { success: false, error: "Error procesando el formulario", details: formError.message },
        { status: 500 }
      );
    }

    // SIEMPRE devolver JSON, incluso si falló la notificación
    console.log('🔥 ===== FIN FORMULARIO =====\n');
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: any) {
    // Catch final para cualquier error no controlado
    console.error("❌❌❌ Form submit error (catch final):", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    console.log('🔥 ===== FIN FORMULARIO (ERROR) =====\n');
    // SIEMPRE devolver JSON, nunca HTML
    return NextResponse.json(
      { success: false, error: "Error procesando el formulario", details: err.message },
      { status: 500 }
    );
  }
}

// CORS opcional si lo usas cross-domain:
// export const dynamic = "force-dynamic";
