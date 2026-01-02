import ConstructionPage from "@/components/construction-page"

export default function AperturaContablePage() {
  const features = [
    {
      iconName: "unlock",
      title: "Apertura Contable",
      description: "Proceso de apertura de nuevo ejercicio contable"
    },
    {
      iconName: "arrow-right",
      title: "Traspaso de Saldos",
      description: "Traspaso automático de saldos de cierre a apertura"
    },
    {
      iconName: "file-text",
      title: "Asientos de Apertura",
      description: "Generación automática de asientos de apertura"
    }
  ]

  return (
    <ConstructionPage
      title="Asiento de Apertura Contable"
      description="Estamos desarrollando el módulo de apertura contable que permitirá iniciar un nuevo ejercicio contable con los saldos del ejercicio anterior."
      features={features}
    />
  )
}







