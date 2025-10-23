"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/fetcher";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface InvitationData {
  valido: boolean;
  email: string;
  rol: string;
  fechaExpiracion: string;
}

export default function RegisterForm({ invite, presetEmail }: { invite?: string; presetEmail?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(presetEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
  }, [presetEmail]);

  useEffect(() => {
    if (invite) {
      validateInvitationToken();
    }
  }, [invite]);

  const validateInvitationToken = async () => {
    if (!invite) return;
    
    setValidatingToken(true);
    try {
      const response = await fetch(`/api/ajustes/validar-token?token=${invite}`);
      const data = await response.json();
      
      if (response.ok && data.valido) {
        setInvitationData(data);
        setEmail(data.email); // Pre-llenar el email de la invitación
      } else {
        setErr(data.error || "Token de invitación inválido");
      }
    } catch (error) {
      setErr("Error al validar la invitación");
    } finally {
      setValidatingToken(false);
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr(null); setOk(null);
    
    if (password !== confirmPassword) {
      setLoading(false);
      return setErr("Las contraseñas no coinciden");
    }

    // Si hay una invitación válida, usar el email de la invitación
    const emailToUse = invitationData ? invitationData.email : email;
    
    const res = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ 
        name, 
        email: emailToUse, 
        password, 
        inviteToken: invite,
        role: invitationData?.rol 
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setErr(data.error || "Error");
    
    // Marcar la invitación como usada
    if (invite) {
      try {
        await fetch("/api/ajustes/validar-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: invite }),
        });
      } catch (error) {
        console.error("Error marking invitation as used:", error);
      }
    }
    
    setOk("Cuenta creada. Redirigiendo...");
    window.location.href = data.redirect || "/";
  }

  // Mostrar estado de validación del token
  if (validatingToken) {
    return (
      <div className="space-y-4 max-w-sm">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Validando invitación...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Mostrar error si la invitación no es válida
  if (invite && !invitationData && err) {
    return (
      <div className="space-y-4 max-w-sm">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {err}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Esta invitación no es válida o ha expirado.
          </p>
          <a 
            href="/login" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-sm">
      {/* Mostrar información de la invitación si es válida */}
      {invitationData && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Invitación válida</p>
              <p className="text-sm">Email: {invitationData.email}</p>
              <p className="text-sm">Rol asignado: {invitationData.rol}</p>
              <p className="text-sm">Expira: {new Date(invitationData.fechaExpiracion).toLocaleDateString()}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input 
          className="mt-1 w-full border rounded px-3 py-2" 
          value={name} 
          onChange={e=>setName(e.target.value)} 
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input 
          className="mt-1 w-full border rounded px-3 py-2" 
          type="email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)} 
          required 
          disabled={!!invitationData} // Deshabilitar si hay invitación válida
        />
        {invitationData && (
          <p className="text-xs text-gray-500 mt-1">
            El email está predefinido por la invitación
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Contraseña</label>
        <input 
          className="mt-1 w-full border rounded px-3 py-2" 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)} 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Confirmar Contraseña</label>
        <input 
          className="mt-1 w-full border rounded px-3 py-2" 
          type="password" 
          value={confirmPassword} 
          onChange={e=>setConfirmPassword(e.target.value)} 
          required 
        />
      </div>
      {ok && <p className="text-green-600 text-center">{ok}</p>}
      {err && <p className="text-red-600 text-center">{err}</p>}
      <div className="flex justify-center">
        <button 
          disabled={loading || (invite && !invitationData)} 
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </div>
    </form>
  );
}
