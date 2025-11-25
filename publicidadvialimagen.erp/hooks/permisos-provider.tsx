"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePermisos, PermisosMatrix } from "./use-permisos";

interface PermisosContextType {
  permisos: PermisosMatrix;
  loading: boolean;
  error: string | null;
  tienePermiso: (modulo: string, accion: string) => boolean;
  puedeVer: (modulo: string) => boolean;
  puedeEditar: (modulo: string) => boolean;
  puedeEliminar: (modulo: string) => boolean;
  esAdmin: (modulo: string) => boolean;
  tieneFuncionTecnica: (accion: string) => boolean;
  refresh: () => Promise<void>;
}

const PermisosContext = createContext<PermisosContextType | undefined>(undefined);

export function PermisosProvider({ children }: { children: ReactNode }) {
  const permisosData = usePermisos();

  return (
    <PermisosContext.Provider value={permisosData}>
      {children}
    </PermisosContext.Provider>
  );
}

export function usePermisosContext() {
  const context = useContext(PermisosContext);
  if (!context) {
    throw new Error("usePermisosContext must be used within PermisosProvider");
  }
  return context;
}

