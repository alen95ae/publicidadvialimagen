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
  const { tienePermiso, loading, permisos } = usePermisosContext();

  // Esperar a que los permisos se carguen antes de verificar
  // Esto evita el renderizado escalonado de botones
  if (loading) {
    return null;
  }

  // Si no hay permisos cargados, no mostrar nada (más seguro)
  if (!permisos || Object.keys(permisos).length === 0) {
    return <>{fallback}</>;
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

/**
 * Componente que muestra contenido solo si el usuario tiene un permiso técnico específico
 */
export function PermisoTecnico({ accion, children, fallback = null }: { accion: string; children: ReactNode; fallback?: ReactNode }) {
  const { tieneFuncionTecnica, loading, permisos } = usePermisosContext();

  // Esperar a que los permisos se carguen antes de verificar
  if (loading) {
    return null;
  }

  // Si no hay permisos cargados, no mostrar nada (más seguro)
  if (!permisos || Object.keys(permisos).length === 0) {
    return <>{fallback}</>;
  }

  // Verificar el permiso técnico específico
  const tienePermiso = tieneFuncionTecnica(accion);
  
  // Log para depuración - SIEMPRE mostrar para "ver historial soportes"
  if (accion === 'ver historial soportes' || accion === 'ver dueño de casa') {
    console.log('🔍 [PermisoTecnico] Verificando permiso:', {
      accion,
      tienePermiso,
      loading,
      permisosTecnicos: permisos['tecnico'],
      tieneAdmin: Object.keys(permisos).some(modulo => modulo !== 'tecnico' && permisos[modulo]?.admin === true),
      valorExplicito: permisos['tecnico']?.[accion],
      todasLasClaves: Object.keys(permisos['tecnico'] || {}),
      permisosCompletos: permisos
    });
  }

  if (tienePermiso) {
    return <>{children}</>;
  }

  // Si no tiene permiso, mostrar fallback o nada
  return <>{fallback}</>;
}

