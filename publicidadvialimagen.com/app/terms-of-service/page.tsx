import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Términos y Condiciones de Servicio</h1>
        </div>

        {/* Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-muted-foreground mb-8">
            El presente documento establece los Términos y Condiciones bajo los cuales Publicidad Vial Imagen S.R.L. (en adelante, "la Empresa") ofrece sus productos y servicios a través de su sitio web y de sus canales de atención.
            <br />
            Al acceder, navegar o utilizar nuestros servicios, usted declara haber leído, comprendido y aceptado estos términos en su totalidad. En caso de no estar de acuerdo, deberá abstenerse de utilizar este sitio o contratar nuestros servicios.
          </p>

          <h2 className="text-2xl font-semibold mb-4">1. Identificación del titular</h2>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <ul className="list-none space-y-2">
              <li><strong>Razón social:</strong> Publicidad Vial Imagen S.R.L.</li>
              <li><strong>Domicilio legal:</strong> C. Nicolás Acosta Esq. Pedro Blanco (Alto San Pedro) N° 1471, La Paz, Bolivia</li>
              <li><strong>Correo electrónico de contacto:</strong> contactos@publicidadvialimagen.com</li>
              <li><strong>Teléfono:</strong> (591-2) 2493155 – 2493156</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mb-4">2. Objeto del sitio web</h2>
          <p className="mb-6">
            El sitio web de Publicidad Vial Imagen S.R.L. tiene como finalidad brindar información sobre nuestros servicios de publicidad exterior, impresión digital y soluciones gráficas, así como facilitar la comunicación, solicitud de presupuestos y contratación de servicios entre la Empresa y sus clientes.
          </p>

          <h2 className="text-2xl font-semibold mb-4">3. Condiciones de uso</h2>
          <p className="mb-4">
            El usuario se compromete a utilizar el sitio web de forma responsable y conforme a la ley, sin realizar actividades que puedan dañar, sobrecargar o interferir en el funcionamiento del mismo.
            <br />
            Asimismo, el usuario acepta no emplear este sitio para fines ilícitos, difamatorios, fraudulentos o que infrinjan derechos de terceros.
          </p>
          <p className="mb-6">
            Publicidad Vial Imagen S.R.L. se reserva el derecho de suspender temporal o permanentemente el acceso al sitio a cualquier usuario que incumpla estas condiciones o haga un uso indebido del servicio.
          </p>

          <h2 className="text-2xl font-semibold mb-4">4. Servicios y contratación</h2>
          <p className="mb-4">
            Los productos y servicios ofrecidos (publicidad exterior, impresión, diseño, instalación, entre otros) se regirán por los términos específicos acordados en cada contrato, orden de trabajo o cotización.
            <br />
            La aceptación de un presupuesto, pedido o contrato implica la conformidad del cliente con las condiciones comerciales, técnicas y de pago establecidas por la Empresa.
          </p>
          <p className="mb-6">
            Los precios, características y disponibilidad de los servicios pueden variar sin previo aviso. Publicidad Vial Imagen S.R.L. se compromete a respetar los acuerdos formalizados antes de dichos cambios.
          </p>

          <h2 className="text-2xl font-semibold mb-4">5. Propiedad intelectual</h2>
          <p className="mb-4">
            Todo el contenido presente en este sitio —incluyendo textos, imágenes, logotipos, marcas, diseños, software y demás elementos— es propiedad exclusiva de Publicidad Vial Imagen S.R.L. o de sus respectivos titulares con licencia de uso, y está protegido por las leyes de propiedad intelectual aplicables.
          </p>
          <p className="mb-6">
            Queda estrictamente prohibida la reproducción, distribución, modificación o utilización de los contenidos con fines comerciales o no autorizados sin el consentimiento previo y por escrito de la Empresa.
          </p>

          <h2 className="text-2xl font-semibold mb-4">6. Protección de datos personales</h2>
          <p className="mb-6">
            La recopilación y tratamiento de los datos personales de los usuarios se rige por nuestra <Link href="/privacy-policy" className="text-primary hover:underline">Política de Privacidad</Link>, disponible en este mismo sitio web.
            <br />
            Al utilizar nuestros servicios, el usuario otorga su consentimiento para el tratamiento de sus datos conforme a lo establecido en dicha política.
          </p>

          <h2 className="text-2xl font-semibold mb-4">7. Uso de cookies</h2>
          <p className="mb-6">
            El sitio web utiliza cookies para mejorar la experiencia del usuario y analizar el tráfico del sitio. El uso de cookies se regula en nuestra <Link href="/cookie-policy" className="text-primary hover:underline">Política de Cookies</Link>, que el usuario puede consultar y gestionar en cualquier momento.
          </p>

          <h2 className="text-2xl font-semibold mb-4">8. Enlaces externos</h2>
          <p className="mb-6">
            Nuestro sitio puede contener enlaces a páginas de terceros. Publicidad Vial Imagen S.R.L. no se responsabiliza por el contenido, políticas o prácticas de dichos sitios externos. El acceso a ellos es responsabilidad exclusiva del usuario.
          </p>

          <h2 className="text-2xl font-semibold mb-4">9. Limitación de responsabilidad</h2>
          <p className="mb-4">
            Publicidad Vial Imagen S.R.L. no será responsable por daños directos o indirectos derivados del uso o imposibilidad de uso de los servicios ofrecidos, ni por errores, interrupciones, virus o fallos técnicos que afecten el funcionamiento del sitio.
          </p>
          <p className="mb-6">
            Asimismo, no garantiza que la información publicada esté libre de errores o actualizada en todo momento, aunque realiza los mayores esfuerzos para mantenerla correcta y vigente.
          </p>

          <h2 className="text-2xl font-semibold mb-4">10. Modificaciones</h2>
          <p className="mb-6">
            La Empresa se reserva el derecho de modificar o actualizar estos Términos y Condiciones en cualquier momento, sin previo aviso.
            <br />
            Las modificaciones entrarán en vigor desde su publicación en el sitio web. Se recomienda revisar periódicamente este documento para mantenerse informado de los cambios.
          </p>

          <h2 className="text-2xl font-semibold mb-4">11. Legislación aplicable y jurisdicción</h2>
          <p className="mb-8">
            Estos Términos y Condiciones se rigen por las leyes vigentes del Estado Plurinacional de Bolivia.
            <br />
            Cualquier controversia derivada de su interpretación o ejecución será sometida a los tribunales competentes de la ciudad de La Paz, Bolivia, salvo acuerdo expreso entre las partes.
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
