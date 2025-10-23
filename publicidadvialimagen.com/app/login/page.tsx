import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu cuenta para gestionar tus cotizaciones
          </p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <LoginForm next={searchParams?.next} />
          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta? <a className="font-medium text-red-600 hover:text-red-500" href="/register">Registrarse</a>
          </p>
        </div>
      </div>
    </div>
  );
}