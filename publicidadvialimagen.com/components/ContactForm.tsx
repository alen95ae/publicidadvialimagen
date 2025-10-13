"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    mensaje: "",
  });
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOk(null);
    setErr(null);

    try {
      const res = await fetch("/api/form/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al enviar");

      setOk("¡Mensaje enviado! Te responderemos pronto.");
      setForm({ nombre: "", email: "", telefono: "", empresa: "", mensaje: "" });
    } catch (e: any) {
      setErr(e.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          name="nombre"
          value={form.nombre}
          onChange={onChange}
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email *</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          type="email"
          name="email"
          value={form.email}
          onChange={onChange}
          placeholder="tu@correo.com"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Teléfono</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          name="telefono"
          value={form.telefono}
          onChange={onChange}
          placeholder="+34 6XX ..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Empresa</label>
        <input
          className="mt-1 w-full border rounded px-3 py-2"
          name="empresa"
          value={form.empresa}
          onChange={onChange}
          placeholder="Nombre de la empresa"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Mensaje *</label>
        <textarea
          className="mt-1 w-full border rounded px-3 py-2"
          name="mensaje"
          value={form.mensaje}
          onChange={onChange}
          rows={5}
          placeholder="Cuéntanos qué necesitas"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded px-4 py-2 border"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>

      {ok && <p className="text-green-600">{ok}</p>}
      {err && <p className="text-red-600">{err}</p>}
    </form>
  );
}
