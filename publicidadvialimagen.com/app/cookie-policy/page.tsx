import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Política de Cookies</h1>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            La presente Política de Cookies explica cómo Publicidad Vial Imagen S.R.L. utiliza cookies y tecnologías similares en su sitio web con el fin de ofrecer una mejor experiencia al usuario, analizar el tráfico y personalizar el contenido publicitario. Al navegar por este sitio, usted acepta el uso de cookies conforme a esta política.
          </p>

          <h2 className="text-2xl font-semibold mb-4">1. ¿Qué son las cookies?</h2>
          <p className="mb-6">
            Las cookies son pequeños archivos de texto que se almacenan en su navegador o dispositivo cuando visita un sitio web. Sirven para reconocer su dispositivo en futuras visitas, recordar sus preferencias y recopilar información sobre cómo utiliza el sitio.
          </p>

          <h2 className="text-2xl font-semibold mb-4">2. Tipos de cookies que utilizamos</h2>
          <p className="mb-4">
            Nuestro sitio web puede emplear los siguientes tipos de cookies:
          </p>
          
          <h3 className="text-xl font-semibold mb-3">Cookies necesarias:</h3>
          <p className="mb-4">
            Son esenciales para el funcionamiento del sitio y permiten el uso de funciones básicas como la navegación y el acceso a áreas seguras. Sin ellas, el sitio no puede funcionar correctamente.
          </p>

          <h3 className="text-xl font-semibold mb-3">Cookies de rendimiento o análisis:</h3>
          <p className="mb-4">
            Nos permiten recopilar información anónima sobre la forma en que los visitantes utilizan nuestro sitio, con el fin de mejorar su funcionamiento y rendimiento.
            <br />
            <strong>Ejemplo:</strong> páginas más visitadas, tiempo de permanencia, errores detectados, etc.
          </p>

          <h3 className="text-xl font-semibold mb-3">Cookies de personalización:</h3>
          <p className="mb-4">
            Permiten recordar sus preferencias (idioma, región, configuración de pantalla) para ofrecerle una experiencia más personalizada en cada visita.
          </p>

          <h3 className="text-xl font-semibold mb-3">Cookies publicitarias o de marketing:</h3>
          <p className="mb-6">
            Se utilizan para mostrar anuncios relevantes según sus intereses. También nos ayudan a medir la efectividad de nuestras campañas publicitarias.
            <br />
            En algunos casos, pueden provenir de terceros con los que colaboramos (como Google Ads, Meta o redes sociales).
          </p>

          <h2 className="text-2xl font-semibold mb-4">3. Cookies de terceros</h2>
          <p className="mb-6">
            Es posible que nuestro sitio incluya enlaces o integraciones de servicios de terceros (por ejemplo, mapas, videos o redes sociales). Estos proveedores pueden instalar sus propias cookies, sobre las cuales Publicidad Vial Imagen S.R.L. no tiene control.
            <br />
            Le recomendamos revisar las políticas de cookies de dichos sitios para conocer su funcionamiento.
          </p>

          <h2 className="text-2xl font-semibold mb-4">4. Gestión y eliminación de cookies</h2>
          <p className="mb-4">
            Usted puede aceptar, rechazar o eliminar las cookies configurando las opciones de su navegador.
            <br />
            A continuación, se incluyen enlaces con las instrucciones para los navegadores más comunes:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Google Chrome</strong></li>
            <li><strong>Mozilla Firefox</strong></li>
            <li><strong>Microsoft Edge</strong></li>
            <li><strong>Safari</strong></li>
          </ul>
          <p className="mb-6">
            Tenga en cuenta que desactivar las cookies puede afectar el funcionamiento correcto de algunas secciones del sitio o limitar la experiencia del usuario.
          </p>

          <h2 className="text-2xl font-semibold mb-4">5. Consentimiento del usuario</h2>
          <p className="mb-6">
            Al continuar navegando en nuestro sitio web sin modificar la configuración de cookies, usted acepta su instalación y uso conforme a esta política. En todo momento puede cambiar o retirar su consentimiento desde la configuración de su navegador.
          </p>

          <h2 className="text-2xl font-semibold mb-4">6. Actualizaciones de la Política de Cookies</h2>
          <p className="mb-8">
            Publicidad Vial Imagen S.R.L. podrá modificar esta Política de Cookies en cualquier momento, con el fin de adaptarla a cambios legislativos, tecnológicos o en la operativa de la empresa.
            <br />
            Se recomienda revisar periódicamente esta página para asegurarse de estar informado sobre la versión más reciente.
          </p>

          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Fecha de última actualización:</strong> 09 de octubre de 2025<br />
              <strong>Empresa responsable:</strong> Publicidad Vial Imagen S.R.L.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
