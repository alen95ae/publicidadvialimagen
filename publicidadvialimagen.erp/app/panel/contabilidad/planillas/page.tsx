import ConstructionPage from "@/components/construction-page"

export default function PlanillasPage() {
  const features = [
    {
      iconName: "users",
      title: "Gestión de Planillas",
      description: "Control completo de nóminas y pagos de personal"
    },
    {
      iconName: "calculator",
      title: "Cálculos",
      description: "Cálculo automático de sueldos, descuentos y aportes"
    },
    {
      iconName: "file-text",
      title: "Asientos Contables",
      description: "Generación automática de asientos desde planillas"
    }
  ]

  return (
    <ConstructionPage
      title="Planillas"
      description="Estamos desarrollando un módulo completo de gestión de planillas que integrará el cálculo de nóminas con la generación automática de asientos contables."
      features={features}
    />
  )
}


