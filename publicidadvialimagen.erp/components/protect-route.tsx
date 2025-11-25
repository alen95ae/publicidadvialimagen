"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermisosContext } from "@/hooks/permisos-provider";

interface ProtectRouteProps {
  modulo: string;
  accion?: "ver" | "editar" | "eliminar" | "admin";
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege una ruta completa basado en permisos
 * Si el usuario no tiene permiso, redirige a /no-autorizado
 * 
 * @example
 * <ProtectRoute modulo="soportes" accion="ver">
 *   <SoportesPage />
 * </ProtectRoute>
 */
export function ProtectRoute({ modulo, accion = "ver", children, redirectTo = "/panel/no-autorizado" }: ProtectRouteProps) {
  const router = useRouter();
  const { permisos, loading, puedeVer, puedeEditar, puedeEliminar, esAdmin } = usePermisosContext();

  useEffect(() => {
    if (loading) return;

    let tienePermiso = false;

    switch (accion) {
      case "ver":
        tienePermiso = puedeVer(modulo);
        break;
      case "editar":
        tienePermiso = puedeEditar(modulo);
        break;
      case "eliminar":
        tienePermiso = puedeEliminar(modulo);
        break;
      case "admin":
        tienePermiso = esAdmin(modulo);
        break;
    }

    if (!tienePermiso) {
      router.push(redirectTo);
    }
  }, [loading, permisos, modulo, accion, router, redirectTo, puedeVer, puedeEditar, puedeEliminar, esAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos antes de renderizar
  let tienePermiso = false;
  switch (accion) {
    case "ver":
      tienePermiso = puedeVer(modulo);
      break;
    case "editar":
      tienePermiso = puedeEditar(modulo);
      break;
    case "eliminar":
      tienePermiso = puedeEliminar(modulo);
      break;
    case "admin":
      tienePermiso = esAdmin(modulo);
      break;
  }

  if (!tienePermiso) {
    return null; // El useEffect ya redirigirá
  }

  return <>{children}</>;
}

