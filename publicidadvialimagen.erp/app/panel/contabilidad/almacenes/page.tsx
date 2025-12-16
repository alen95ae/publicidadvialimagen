import ConstructionPage from "@/components/construction-page"

export default function AlmacenesPage() {
  const features = [
    {
      iconName: "package",
      title: "Gestión de Almacenes",
      description: "Control de inventarios y movimientos de almacén"
    },
    {
      iconName: "arrow-left-right",
      title: "Movimientos",
      description: "Registro de entradas y salidas de almacén"
    },
    {
      iconName: "clipboard-check",
      title: "Valorización",
      description: "Valorización de inventarios y costos"
    }
  ]

  return (
    <ConstructionPage
      title="Almacenes"
      description="Estamos desarrollando un módulo completo de gestión de almacenes que integrará el control de inventarios con la contabilidad."
      features={features}
    />
  )
}


