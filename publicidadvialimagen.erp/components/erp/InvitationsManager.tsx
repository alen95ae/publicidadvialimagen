"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/fetcher";

type Rec = { id: string; fields: any };

export default function InvitationsManager() {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<"usuario"|"admin">("usuario");
  const [days, setDays] = useState(7);
  const [links, setLinks] = useState<{id:string;email:string;role:string;link:string}[]>([]);
  const [list, setList] = useState<Rec[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function loadList() {
    const res = await api("/api/admin/invitations/list");
    const data = await res.json();
    if (res.ok) setList(data.records || []);
    else setErr(data.error || "Error listando invitaciones");
  }

  useEffect(() => { loadList(); }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setLinks([]);
    const arr = emails.split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
    if (arr.length === 0) return setErr("Añade al menos un email");
    const res = await api("/api/admin/invitations/create", {
      method: "POST",
      body: JSON.stringify({ emails: arr, role, expiresDays: days }),
    });
    const data = await res.json();
    if (!res.ok) return setErr(data.error || "Error creando invitaciones");
    setLinks(data.links || []);
    setEmails("");
    loadList();
  }

  async function revoke(id: string) {
    const res = await api("/api/admin/invitations/revoke", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    if (res.ok) loadList();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="space-y-3 border rounded p-4">
        <h3 className="text-lg font-semibold">Enviar invitación</h3>
        <div>
          <label className="block text-sm font-medium">Emails (separados por coma o salto de línea)</label>
          <textarea className="mt-1 w-full border rounded px-3 py-2" rows={4}
            value={emails} onChange={e=>setEmails(e.target.value)} placeholder="empleado1@empresa.com, empleado2@empresa.com" />
        </div>
        <div className="flex gap-3">
          <div>
            <label className="block text-sm font-medium">Rol</label>
            <select className="mt-1 border rounded px-3 py-2" value={role} onChange={e=>setRole(e.target.value as any)}>
              <option value="usuario">usuario (empleado)</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Caducidad (días)</label>
            <input className="mt-1 border rounded px-3 py-2 w-24" type="number" min={1} max={365}
              value={days} onChange={e=>setDays(parseInt(e.target.value || "7"))}/>
          </div>
        </div>
        <button className="border rounded px-4 py-2">Generar invitaciones</button>
        {err && <p className="text-red-600">{err}</p>}
      </form>

      {links.length > 0 && (
        <div className="border rounded p-4 space-y-2">
          <h3 className="font-semibold">Links generados</h3>
          {links.map(l => (
            <div key={l.id} className="flex items-center justify-between gap-3">
              <div className="text-sm">
                <div><b>{l.email}</b> → <span className="uppercase">{l.role}</span></div>
                <div className="truncate">{l.link}</div>
              </div>
              <button
                className="border rounded px-3 py-1"
                onClick={() => navigator.clipboard.writeText(l.link)}
              >
                Copiar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Invitaciones existentes</h3>
        <div className="text-xs text-gray-600 mb-2">Las invitaciones aceptadas o revocadas no pueden usarse.</div>
        <div className="space-y-2">
          {list.map(r => {
            const f = r.fields || {};
            return (
              <div key={r.id} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div><b>{f.Email}</b> — rol <span className="uppercase">{f.Role}</span></div>
                  <div>Expira: {f.ExpiresAt ? new Date(f.ExpiresAt).toLocaleString() : "—"}</div>
                  <div>Accepted: {f.Accepted ? "sí" : "no"} | Revoked: {f.Revoked ? "sí" : "no"}</div>
                </div>
                {!f.Revoked && !f.Accepted && (
                  <button className="border rounded px-3 py-1" onClick={() => revoke(r.id)}>Revocar</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
