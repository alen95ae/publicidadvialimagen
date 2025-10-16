"use client";

import { Suspense } from "react";
import RegisterInner from "./RegisterInner";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md shadow-lg bg-white rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando registro...</p>
      </div>
    </div>}>
      <RegisterInner />
    </Suspense>
  );
}
