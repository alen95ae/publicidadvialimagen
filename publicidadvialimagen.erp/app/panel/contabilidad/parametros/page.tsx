import ConstructionPage from "@/components/construction-page"

export default function ParametrosPage() {
  const features = [
    {
      iconName: "settings",
      title: "Parámetros Contables",
      description: "Configuración de parámetros del sistema contable"
    },
    {
      iconName: "sliders",
      title: "Configuración",
      description: "Ajustes de cuentas, monedas y tipos de cambio"
    },
    {
      iconName: "save",
      title: "Guardado",
      description: "Persistencia de configuraciones del sistema"
    }
  ]

  return (
    <ConstructionPage
      title="Parámetros"
      description="Estamos desarrollando el módulo de parámetros contables que permitirá configurar todas las opciones del sistema contable."
      features={features}
    />
  )
}


