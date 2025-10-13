"use client";

import RegisterForm from "@/components/auth/RegisterForm";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const invite = searchParams.get('invite');
  const email = searchParams.get('email');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Crear cuenta</h1>
      <RegisterForm invite={invite} presetEmail={email} />
      <p className="mt-4 text-sm">¿Ya tienes cuenta? <a className="underline" href="/login">Inicia sesión</a></p>
    </div>
  );
}