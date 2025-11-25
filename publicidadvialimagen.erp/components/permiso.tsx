"use client";

import { ReactNode } from "react";
import { usePermisosContext } from "@/hooks/permisos-provider";

interface PermisoProps {
  modulo: string;
  accion: "ver" | "editar" | "eliminar" | "admin";
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que muestra u oculta contenido basado en permisos
 * 
 * @example
 * <Permiso modulo="soportes" accion="editar">
 *   <Button>Editar</Button>
 * </Permiso>
 */
export function Permiso({ modulo, accion, children, fallback = null }: PermisoProps) {
  const { tienePermiso, loading } = usePermisosContext();

  // Esperar a que los permisos se carguen antes de verificar
  // Esto evita el renderizado escalonado de botones
  if (loading) {
    return null;
  }

  // Si tiene admin, tiene todos los permisos
  if (tienePermiso(modulo, "admin")) {
    return <>{children}</>;
  }

  // Verificar el permiso específico
  if (tienePermiso(modulo, accion)) {
    return <>{children}</>;
  }

  // Si no tiene permiso, mostrar fallback o nada
  return <>{fallback}</>;
}

/**
 * Componente que muestra contenido solo si el usuario puede ver el módulo
 */
export function PermisoVer({ modulo, children, fallback = null }: { modulo: string; children: ReactNode; fallback?: ReactNode }) {
  return <Permiso modulo={modulo} accion="ver">{children}</Permiso>;
}

/**
 * Componente que muestra contenido solo si el usuario puede editar
 */
export function PermisoEditar({ modulo, children, fallback = null }: { modulo: string; children: ReactNode; fallback?: ReactNode }) {
  return <Permiso modulo={modulo} accion="editar">{children}</Permiso>;
}

/**
 * Componente que muestra contenido solo si el usuario puede eliminar
 */
export function PermisoEliminar({ modulo, children, fallback = null }: { modulo: string; children: ReactNode; fallback?: ReactNode }) {
  return <Permiso modulo={modulo} accion="eliminar">{children}</Permiso>;
}

