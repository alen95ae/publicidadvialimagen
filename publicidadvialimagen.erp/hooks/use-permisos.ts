"use client";

import { useState, useEffect } from "react";

export interface PermisosMatrix {
  [modulo: string]: {
    ver?: boolean;
    editar?: boolean;
    eliminar?: boolean;
    admin?: boolean;
    [accion: string]: boolean | undefined; // Permite acciones personalizadas (permisos técnicos)
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
        cache: "no-store",
        next: { revalidate: 0 }
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

    // Si tiene admin (solo para módulos no técnicos), tiene todos los permisos estándar
    if (modulo !== 'tecnico' && moduloPermisos.admin) {
      // Para módulos normales, admin da acceso a ver, editar, eliminar
      if (accion === 'ver' || accion === 'editar' || accion === 'eliminar' || accion === 'admin') {
        return true;
      }
    }

    // Acceder directamente a la propiedad (funciona para acciones estándar y personalizadas)
    return (moduloPermisos as Record<string, boolean | undefined>)[accion] || false;
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
    // Los permisos técnicos deben verificarse específicamente, no se otorgan automáticamente
    // Solo verificar el permiso específico en el módulo "tecnico"
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

