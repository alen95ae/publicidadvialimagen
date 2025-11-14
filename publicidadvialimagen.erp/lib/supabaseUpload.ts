import { getSupabaseServer } from "@/lib/supabaseServer";

export async function uploadImage(file: File | Blob, filename: string) {
  const supabase = getSupabaseServer();
  
  // Generar path único con timestamp
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `imagenes/${timestamp}-${sanitizedFilename}`;

  // Subir archivo a Supabase Storage
  const { data: uploadData, error } = await supabase.storage
    .from("soportes")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    console.error("Error subiendo imagen:", error);
    throw error;
  }

  // Obtener URL pública
  const { data } = supabase.storage
    .from("soportes")
    .getPublicUrl(path);

  return data.publicUrl;
}

