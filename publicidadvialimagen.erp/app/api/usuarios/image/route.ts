import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { updateUserSupabase } from "@/lib/supabaseUsers";

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ success: false, error: 'Sesión inválida' }, { status: 401 });
    }

    const userId = session.sub;
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

