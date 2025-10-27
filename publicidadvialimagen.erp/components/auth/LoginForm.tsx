"use client";
import { useState } from "react";
import { api } from "@/lib/fetcher";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null);
    
    try {
      const res = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) return setErr(data.error || "Error");
      const target = next || data.redirect || "/";
      window.location.href = target;
    } catch (error) {
      setLoading(false);
      setErr("Error de conexión");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Contraseña</label>
        <div className="relative">
          <input 
            className="mt-1 w-full border rounded px-3 py-2 pr-10" 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={e=>setPassword(e.target.value)} 
            required 
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
          Mantener sesión iniciada
        </label>
      </div>
      {err && <p className="text-red-600 text-center">{err}</p>}
      <div className="flex justify-center">
        <button disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 font-medium">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}
