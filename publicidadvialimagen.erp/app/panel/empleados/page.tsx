import ConstructionPage from "@/components/construction-page"

export default function EmpleadosPage() {
  const features = [
    {
      iconName: "users",
      title: "Gestión de Personal",
      description: "Control completo de empleados y sus datos"
    },
    {
      iconName: "user-plus",
      title: "Reclutamiento",
      description: "Proceso de selección y onboarding de personal"
    },
    {
      iconName: "calendar",
      title: "Horarios",
      description: "Gestión de turnos y horarios de trabajo"
    }
  ]

  return (
    <ConstructionPage
      title="Empleados"
      description="Desarrollando un módulo completo de gestión de recursos humanos que incluirá control de personal, nóminas, horarios, evaluaciones y todo lo necesario para la administración de empleados."
      features={features}
    />
  )
}