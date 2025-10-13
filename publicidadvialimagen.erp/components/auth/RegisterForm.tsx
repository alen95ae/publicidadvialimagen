"use client";
import { useState, useEffect } from "react";

export default function RegisterForm({ invite, presetEmail }: { invite?: string; presetEmail?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(presetEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
  }, [presetEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setOk(null);
    
    if (password !== confirmPassword) {
      setLoading(false);
      return setErr("Las contraseñas no coinciden");
    }
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteToken: invite }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(data.error || "Error");
    setOk("Cuenta creada. Redirigiendo...");
    window.location.href = data.redirect || "/";
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Contraseña</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Confirmar Contraseña</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
      </div>
      {ok && <p className="text-green-600 text-center">{ok}</p>}
      {err && <p className="text-red-600 text-center">{err}</p>}
      <div className="flex justify-center">
        <button disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 font-medium">
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </div>
    </form>
  );
}
