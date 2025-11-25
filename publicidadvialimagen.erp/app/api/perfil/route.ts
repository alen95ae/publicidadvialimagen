import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { updateUserSupabase, findUserByEmailSupabase } from "@/lib/supabaseUsers";
import { getSupabaseServer } from "@/lib/supabaseServer";
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
    const { nombre, email, passwordActual, passwordNueva } = body;

    const updateData: {
      nombre?: string;
      email?: string;
      password_hash?: string;
    } = {};

    // Verificar contraseña actual si se está cambiando
    if (passwordNueva) {
      if (!passwordActual) {
        return NextResponse.json({ error: "Debes ingresar tu contraseña actual" }, { status: 400 });
      }

      const supabase = getSupabaseServer();
      const { data: userData } = await supabase
        .from('usuarios')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (!userData || !userData.password_hash) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const isValidPassword = await bcrypt.compare(passwordActual, userData.password_hash);
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

    if (nombre !== undefined) {
      updateData.nombre = nombre;
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

