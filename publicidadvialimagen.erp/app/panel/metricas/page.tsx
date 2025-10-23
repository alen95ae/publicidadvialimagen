import ConstructionPage from "@/components/construction-page"

export default function MetricasPage() {
  const features = [
    {
      iconName: "chart",
      title: "Dashboard",
      description: "Visualización completa de métricas y KPIs"
    },
    {
      iconName: "trending",
      title: "Análisis",
      description: "Tendencias y análisis predictivo de datos"
    },
    {
      iconName: "pie-chart",
      title: "Reportes",
      description: "Reportes personalizados y exportables"
    }
  ]

  return (
    <ConstructionPage
      title="Métricas"
      description="Desarrollando un sistema avanzado de métricas y análisis que te proporcionará insights valiosos sobre el rendimiento de tu negocio, con dashboards interactivos y reportes detallados."
      features={features}
    />
  )
}
