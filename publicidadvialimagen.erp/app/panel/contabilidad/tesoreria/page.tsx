import ConstructionPage from "@/components/construction-page"

export default function TesoreriaPage() {
  const features = [
    {
      iconName: "wallet",
      title: "Gestión de Tesorería",
      description: "Control completo de flujos de caja y movimientos bancarios"
    },
    {
      iconName: "trending-up",
      title: "Análisis Financiero",
      description: "Reportes y análisis de liquidez y flujo de efectivo"
    },
    {
      iconName: "credit-card",
      title: "Conciliaciones",
      description: "Conciliación automática de cuentas bancarias"
    }
  ]

  return (
    <ConstructionPage
      title="Tesorería"
      description="Estamos desarrollando un módulo completo de gestión de tesorería que te permitirá controlar todos los flujos de caja, movimientos bancarios y análisis financiero."
      features={features}
    />
  )
}


