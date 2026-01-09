import ConstructionPage from "@/components/construction-page"

export default function CierreContablePage() {
  const features = [
    {
      iconName: "lock",
      title: "Cierre Contable",
      description: "Proceso de cierre de ejercicio contable"
    },
    {
      iconName: "check-circle",
      title: "Validaciones",
      description: "Validación de saldos y cuentas antes del cierre"
    },
    {
      iconName: "file-text",
      title: "Asientos de Cierre",
      description: "Generación automática de asientos de cierre"
    }
  ]

  return (
    <ConstructionPage
      title="Asiento de Cierre Contable"
      description="Estamos desarrollando el módulo de cierre contable que permitirá realizar el cierre de ejercicio con todas las validaciones y asientos necesarios."
      features={features}
    />
  )
}








