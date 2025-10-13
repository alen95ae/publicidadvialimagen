"use client";
import { useState } from "react";

export default function ContactMiniForm() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", empresa: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null); setErr(null);
    try {
      const res = await fetch("/api/form/simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Fallo al guardar");
      setMsg("Datos guardados en Contactos (upsert) y Mensajes (create).");
      setForm({ nombre: "", email: "", telefono: "", empresa: "" });
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input name="nombre" value={form.nombre} onChange={onChange}
               placeholder="Nombre" className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input type="email" name="email" value={form.email} onChange={onChange}
               placeholder="Correo electrónico" required className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Teléfono</label>
        <input name="telefono" value={form.telefono} onChange={onChange}
               placeholder="Teléfono" className="mt-1 w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Empresa</label>
        <input name="empresa" value={form.empresa} onChange={onChange}
               placeholder="Empresa" className="mt-1 w-full border rounded px-3 py-2" />
      </div>

      <div className="md:col-span-2">
        <button type="submit" disabled={loading} className="border rounded px-4 py-2">
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {msg && <p className="text-green-600 md:col-span-2">{msg}</p>}
      {err && <p className="text-red-600 md:col-span-2">{err}</p>}
    </form>
  );
}


