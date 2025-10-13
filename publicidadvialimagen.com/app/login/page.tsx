import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Iniciar sesión</h1>
      <LoginForm next={searchParams?.next} />
      <p className="mt-4 text-sm">¿No tienes cuenta? <a className="underline" href="/register">Registrarse</a></p>
    </div>
  );
}