// app/api/form/submit/route.ts
import { NextResponse } from "next/server";
import { createContactoYMensaje } from "./service";

export async function POST(req: Request) {
  console.log('\n🔥 ===== FORMULARIO RECIBIDO =====');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    const body = await req.json();
    console.log('📦 Body recibido:', JSON.stringify(body, null, 2));

    const nombre = (body?.nombre ?? "").toString();
    const email = (body?.email ?? "").toString();
    const telefono = (body?.telefono ?? "").toString();
    const empresa = (body?.empresa ?? "").toString();
    const mensaje = (body?.mensaje ?? "").toString();

    console.log('📋 Datos procesados:', { nombre, email, telefono, empresa, mensaje });

    if (!email || !mensaje) {
      console.log('❌ Validación fallida: falta email o mensaje');
      return NextResponse.json(
        { error: "Email y Mensaje son obligatorios" },
        { status: 400 }
      );
    }

    console.log('✅ Validación OK, llamando a createContactoYMensaje...');
    const result = await createContactoYMensaje({
      nombre,
      email,
      telefono,
      empresa,
      mensaje,
    });

    console.log('✅ Resultado:', result);
    console.log('🔥 ===== FIN FORMULARIO =====\n');
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (err: any) {
    console.error("❌❌❌ Form submit error:", err);
    console.error("Error details:", err.message);
    console.error("Error stack:", err.stack);
    console.log('🔥 ===== FIN FORMULARIO (ERROR) =====\n');
    return NextResponse.json(
      { error: "Error procesando el formulario", details: err.message },
      { status: 500 }
    );
  }
}

// CORS opcional si lo usas cross-domain:
// export const dynamic = "force-dynamic";
