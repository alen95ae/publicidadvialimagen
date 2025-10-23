import ConstructionPage from "@/components/construction-page"

export default function ProduccionPage() {
  const features = [
    {
      iconName: "hammer",
      title: "Gestión de Producción",
      description: "Control completo del proceso productivo y recursos"
    },
    {
      iconName: "clock",
      title: "Planificación",
      description: "Optimización de tiempos y recursos de producción"
    },
    {
      iconName: "settings",
      title: "Configuración",
      description: "Ajustes avanzados para procesos específicos"
    }
  ]

  return (
    <ConstructionPage
      title="Producción"
      description="Estamos desarrollando un módulo completo de gestión de producción que te permitirá controlar todos los aspectos del proceso productivo, desde la planificación hasta la entrega final."
      features={features}
    />
  )
}