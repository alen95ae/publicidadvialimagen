import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { updateUserSupabase } from "@/lib/supabaseUsers";

export const runtime = 'nodejs'

// Middleware para verificar que el usuario es administrador
async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const payload = await verifySession(token);
    const isDeveloper = payload?.email?.toLowerCase() === "alen95ae@gmail.com";
    const isAdmin = payload?.role === "admin";
    
    if (!payload || (!isAdmin && !isDeveloper)) {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }
    return payload;
  } catch (error) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: 'ID de usuario requerido' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'El archivo no puede superar los 5MB' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser una imagen (JPG, PNG, GIF)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'soportes';
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `usuarios/${userId}/${timestamp}-${sanitizedFilename}`;

    // Convertir File a Buffer para Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: true // Permitir sobrescribir
      });

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return NextResponse.json(
        { success: false, error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    const publicUrl = publicUrlData.publicUrl;

    // Guardar URL en la base de datos (formato JSONB)
    const imagenData = {
      url: publicUrl,
      path: path,
      uploadedAt: new Date().toISOString()
    };

    await updateUserSupabase(userId, {
      imagen_usuario: imagenData
    });

    return NextResponse.json({
      success: true,
      data: {
        publicUrl: publicUrl
      }
    });
  } catch (error) {
    console.error('Error uploading user image:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir imagen' },
      { status: 500 }
    );
  }
}

