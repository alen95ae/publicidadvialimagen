import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

// Roles disponibles en el sistema
const ROLES = [
  {
    id: "admin",
    nombre: "admin",
    descripcion: "Acceso completo al sistema, incluyendo ajustes y gestión de usuarios",
    permisos: {
      soportes: { view: true, edit: true, delete: true },
      contactos: { view: true, edit: true, delete: true },
      mensajes: { view: true, edit: true, delete: true },
      inventario: { view: true, edit: true, delete: true },
      calendario: { view: true, edit: true, delete: true },
      produccion: { view: true, edit: true, delete: true },
      ventas: { view: true, edit: true, delete: true },
      contabilidad: { view: true, edit: true, delete: true },
      reservas: { view: true, edit: true, delete: true },
      clientes: { view: true, edit: true, delete: true },
      empleados: { view: true, edit: true, delete: true },
      diseno: { view: true, edit: true, delete: true },
      sitio: { view: true, edit: true, delete: true },
      ajustes: { view: true, edit: true, delete: true }
    },
    esPredefinido: true
  },
  {
    id: "usuario",
    nombre: "usuario",
    descripcion: "Acceso limitado a funciones específicas",
    permisos: {
      soportes: { view: false, edit: false, delete: false },
      contactos: { view: false, edit: false, delete: false },
      mensajes: { view: false, edit: false, delete: false },
      inventario: { view: false, edit: false, delete: false },
      calendario: { view: false, edit: false, delete: false },
      produccion: { view: false, edit: false, delete: false },
      ventas: { view: false, edit: false, delete: false },
      contabilidad: { view: false, edit: false, delete: false },
      reservas: { view: false, edit: false, delete: false },
      clientes: { view: false, edit: false, delete: false },
      empleados: { view: false, edit: false, delete: false },
      diseno: { view: false, edit: false, delete: false },
      sitio: { view: false, edit: false, delete: false },
      ajustes: { view: false, edit: false, delete: false }
    },
    esPredefinido: true
  }
];

// GET - Obtener roles disponibles
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de administrador
    const token = request.cookies.get("session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Token de sesión no encontrado" }, { status: 401 });
    }
    
    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de administrador" }, { status: 403 });
    }

    return NextResponse.json({ roles: ROLES });
  } catch (error) {
    console.error("Error al obtener roles:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}