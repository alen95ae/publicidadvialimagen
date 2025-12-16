import ConstructionPage from "@/components/construction-page"

export default function VentasContabilidadPage() {
  const features = [
    {
      iconName: "shopping-cart",
      title: "Gestión de Ventas",
      description: "Control completo de ventas y facturación contable"
    },
    {
      iconName: "file-text",
      title: "Facturación",
      description: "Generación automática de asientos contables desde ventas"
    },
    {
      iconName: "bar-chart",
      title: "Reportes",
      description: "Análisis de ventas y rentabilidad"
    }
  ]

  return (
    <ConstructionPage
      title="Ventas - Contabilidad"
      description="Estamos desarrollando la integración contable del módulo de ventas que permitirá generar automáticamente los asientos contables desde las ventas realizadas."
      features={features}
    />
  )
}


