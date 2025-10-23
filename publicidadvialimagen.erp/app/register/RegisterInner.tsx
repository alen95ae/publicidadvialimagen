"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface InvitationData {
  email: string;
  rol: string;
  fechaExpiracion: string;
}

export default function RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      setLoading(false);
      return;
    }

    // Verificar la invitación
    verifyInvitation(token, email);
  }, [searchParams]);

  const verifyInvitation = async (token: string, email: string) => {
    try {
      const response = await fetch(`/api/ajustes/verify-invitation?token=${token}&email=${email}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setInvitationData(data.invitation);
        setFormData(prev => ({ ...prev, email: data.invitation.email }));
      } else {
        toast({
          title: "Error",
          description: data.error || "Invitación no válida",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al verificar la invitación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          token: searchParams.get('token'),
          email: searchParams.get('email'),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Marcar invitación como usada
        await fetch("/api/ajustes/verify-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: searchParams.get('token'),
            email: searchParams.get('email'),
          }),
        });

        setRegistrationSuccess(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al crear la cuenta",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
              <CardDescription className="mt-2">Esta página solo es accesible con un enlace de invitación válido</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No tienes acceso a esta página. Contacta al administrador para obtener una invitación.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push("/login")} 
              className="w-full"
              variant="outline"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista de éxito
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-green-600">¡Registro Exitoso!</CardTitle>
              <CardDescription className="mt-2">Tu cuenta ha sido creada correctamente</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p className="font-semibold">Usuario creado correctamente</p>
                  <p>Tu cuenta ha sido registrada en el sistema ERP. Ya puedes iniciar sesión con tus credenciales.</p>
                </div>
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push("/login")} 
              className="w-full bg-[#D54644] hover:bg-[#B93D3B] text-white"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/logo-publicidad-vial-imagen.svg" alt="Publicidad Vial Imagen" width={200} height={60} className="h-16 w-auto" priority />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Registro ERP</CardTitle>
            <CardDescription className="mt-2">Completa tu registro con la invitación recibida</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información de la invitación */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p><strong>Email:</strong> {invitationData.email}</p>
                <p><strong>Rol asignado:</strong> {invitationData.rol}</p>
                <p><strong>Expira:</strong> {new Date(invitationData.fechaExpiracion).toLocaleDateString()}</p>
              </div>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  className={errors.nombre ? "border-red-500" : ""}
                  placeholder="Tu nombre"
                />
                {errors.nombre && (
                  <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                placeholder="tu@email.com"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email predefinido por la invitación</p>
            </div>

            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                  placeholder="Mínimo 8 caracteres"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                  placeholder="Repite tu contraseña"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#D54644] hover:bg-[#B93D3B] text-white" 
              disabled={submitting}
            >
              {submitting ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">¿Ya tienes cuenta?</p>
            <Button 
              variant="outline" 
              className="w-full mt-2" 
              onClick={() => router.push("/login")}
            >
              Iniciar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
