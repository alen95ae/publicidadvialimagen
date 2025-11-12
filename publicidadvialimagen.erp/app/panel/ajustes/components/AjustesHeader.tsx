"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AjustesHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-slate-800">Ajustes</div>
        <div className="flex items-center gap-6 ml-4">
          <Link 
            href="/panel/ajustes/usuarios" 
            className={`text-sm font-medium transition-colors ${
              pathname === "/panel/ajustes/usuarios" 
                ? "text-[#D54644]" 
                : "text-gray-600 hover:text-[#D54644]"
            }`}
          >
            Usuarios
          </Link>
          <Link 
            href="/panel/ajustes/roles" 
            className={`text-sm font-medium transition-colors ${
              pathname === "/panel/ajustes/roles" 
                ? "text-[#D54644]" 
                : "text-gray-600 hover:text-[#D54644]"
            }`}
          >
            Roles y Permisos
          </Link>
          <Link 
            href="/panel/ajustes/invitaciones" 
            className={`text-sm font-medium transition-colors ${
              pathname === "/panel/ajustes/invitaciones" 
                ? "text-[#D54644]" 
                : "text-gray-600 hover:text-[#D54644]"
            }`}
          >
            Invitaciones
          </Link>
        </div>
      </div>
    </header>
  );
}
