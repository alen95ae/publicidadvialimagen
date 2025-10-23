import ConstructionPage from "@/components/construction-page"

export default function ContabilidadPage() {
  const features = [
    {
      iconName: "receipt",
      title: "Facturación",
      description: "Gestión completa de facturas y documentos contables"
    },
    {
      iconName: "calculator",
      title: "Cálculos",
      description: "Automatización de cálculos fiscales y contables"
    },
    {
      iconName: "trending",
      title: "Reportes",
      description: "Análisis financiero y reportes detallados"
    }
  ]

  return (
    <ConstructionPage
      title="Contabilidad"
      description="Desarrollando un módulo de contabilidad completo que te permitirá gestionar todas las operaciones financieras, facturación, reportes fiscales y análisis económico de tu empresa."
      features={features}
    />
  )
}