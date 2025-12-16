import ConstructionPage from "@/components/construction-page"

export default function ActivosPage() {
  const features = [
    {
      iconName: "building",
      title: "Gestión de Activos",
      description: "Control completo de activos fijos y depreciaciones"
    },
    {
      iconName: "trending-down",
      title: "Depreciaciones",
      description: "Cálculo automático de depreciaciones contables"
    },
    {
      iconName: "file-check",
      title: "Reportes",
      description: "Informes de activos y depreciaciones acumuladas"
    }
  ]

  return (
    <ConstructionPage
      title="Activos"
      description="Estamos desarrollando un módulo completo de gestión de activos fijos que permitirá controlar y depreciar todos los activos de la empresa."
      features={features}
    />
  )
}



