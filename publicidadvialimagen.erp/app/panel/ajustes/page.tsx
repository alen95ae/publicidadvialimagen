import ConstructionPage from "@/components/construction-page"

export default function AjustesPage() {
  const features = [
    {
      iconName: "settings",
      title: "Configuración",
      description: "Ajustes generales del sistema y preferencias"
    },
    {
      iconName: "shield",
      title: "Seguridad",
      description: "Configuración de permisos y seguridad"
    },
    {
      iconName: "database",
      title: "Respaldo",
      description: "Gestión de respaldos y restauración de datos"
    }
  ]

  return (
    <ConstructionPage
      title="Ajustes"
      description="Desarrollando un módulo de configuración completo que te permitirá personalizar el sistema, gestionar usuarios, configurar seguridad y administrar todas las opciones del ERP."
      features={features}
    />
  )
}