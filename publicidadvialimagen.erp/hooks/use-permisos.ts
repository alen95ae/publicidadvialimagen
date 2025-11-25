"use client";

import { useState, useEffect } from "react";

export interface PermisosMatrix {
  [modulo: string]: {
    ver: boolean;
    editar: boolean;
    eliminar: boolean;
    admin: boolean;
  };
}

export function usePermisos() {
  const [permisos, setPermisos] = useState<PermisosMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermisos();
  }, []);

  const loadPermisos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/permisos", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar permisos");
      }

      const data = await response.json();
      setPermisos(data.permisos || {});
    } catch (err) {
      console.error("Error loading permisos:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPermisos({});
    } finally {
      setLoading(false);
    }
  };

  // Helper para verificar un permiso específico
  const tienePermiso = (modulo: string, accion: string): boolean => {
    const moduloPermisos = permisos[modulo];
    if (!moduloPermisos) return false;

    // Si tiene admin, tiene todos los permisos
    if (moduloPermisos.admin) return true;

    return moduloPermisos[accion as keyof typeof moduloPermisos] || false;
  };

  // Helper para verificar si puede ver el módulo
  const puedeVer = (modulo: string): boolean => {
    return tienePermiso(modulo, "ver") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si puede editar
  const puedeEditar = (modulo: string): boolean => {
    return tienePermiso(modulo, "editar") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si puede eliminar
  const puedeEliminar = (modulo: string): boolean => {
    return tienePermiso(modulo, "eliminar") || tienePermiso(modulo, "admin");
  };

  // Helper para verificar si es admin del módulo
  const esAdmin = (modulo: string): boolean => {
    return tienePermiso(modulo, "admin");
  };

  // Helper para verificar funciones técnicas
  const tieneFuncionTecnica = (accion: string): boolean => {
    return tienePermiso("tecnico", accion);
  };

  return {
    permisos,
    loading,
    error,
    tienePermiso,
    puedeVer,
    puedeEditar,
    puedeEliminar,
    esAdmin,
    tieneFuncionTecnica,
    refresh: loadPermisos,
  };
}

