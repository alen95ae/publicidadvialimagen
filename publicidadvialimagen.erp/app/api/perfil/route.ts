import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { updateUserSupabase, findUserByEmailSupabase } from "@/lib/supabaseUsers";
import { getSupabaseUser, getSupabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";

// PUT /api/perfil - Actualizar perfil del usuario actual
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const userId = session.sub;
    const body = await request.json();
    const { nombre, email, telefono, passwordActual, passwordNueva } = body;

    const updateData: {
      nombre?: string;
      email?: string;
      numero?: string;
      password_hash?: string;
    } = {};

    // Verificar contraseña actual si se está cambiando
    if (passwordNueva) {
      if (!passwordActual) {
        return NextResponse.json({ error: "Debes ingresar tu contraseña actual" }, { status: 400 });
      }

      // FASE 0: Usar cliente de usuario (bajo riesgo - usuario lee su propia contraseña)
      const supabase = await getSupabaseUser(request);
      // ⚠️ TEMPORAL: Fallback a admin si no hay sesión (solo para FASE 0)
      // ANTES DE ACTIVAR RLS: Eliminar este fallback y manejar el error correctamente
      const supabaseClient = supabase || getSupabaseAdmin();
      
      const { data: userData } = await supabaseClient
        .from('usuarios')
        .select('passwordhash')
        .eq('id', userId)
        .single();

      if (!userData || !userData.passwordhash) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(passwordActual, userData.passwordhash);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
      }

      updateData.password_hash = await bcrypt.hash(passwordNueva, 10);
    }

    // Verificar si el email ya está en uso por otro usuario
    if (email && email !== session.email) {
      const existingUser = await findUserByEmailSupabase(email);
      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
      }
      updateData.email = email;
    }

    // El nombre no es editable desde el perfil, se ignora si se envía
    // if (nombre !== undefined) {
    //   updateData.nombre = nombre;
    // }

    if (telefono !== undefined) {
      updateData.numero = telefono;
    }

    const updatedUser = await updateUserSupabase(userId, updateData);
    if (!updatedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}

