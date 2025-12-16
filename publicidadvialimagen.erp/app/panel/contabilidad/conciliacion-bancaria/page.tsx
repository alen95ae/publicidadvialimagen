import ConstructionPage from "@/components/construction-page"

export default function ConciliacionBancariaPage() {
  const features = [
    {
      iconName: "bank",
      title: "Conciliación Bancaria",
      description: "Conciliación automática de movimientos bancarios"
    },
    {
      iconName: "refresh-cw",
      title: "Sincronización",
      description: "Sincronización con extractos bancarios"
    },
    {
      iconName: "check-circle",
      title: "Validación",
      description: "Validación y ajuste de diferencias"
    }
  ]

  return (
    <ConstructionPage
      title="Conciliación Bancaria"
      description="Estamos desarrollando el módulo de conciliación bancaria que permitirá conciliar automáticamente los movimientos contables con los extractos bancarios."
      features={features}
    />
  )
}


