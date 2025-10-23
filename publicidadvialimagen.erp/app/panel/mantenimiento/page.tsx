import ConstructionPage from "@/components/construction-page"

export default function MantenimientoPage() {
  const features = [
    {
      iconName: "wrench",
      title: "Gestión de Mantenimiento",
      description: "Control y seguimiento de tareas de mantenimiento"
    },
    {
      iconName: "calendar",
      title: "Programación",
      description: "Planificación automática de mantenimientos preventivos"
    },
    {
      iconName: "alert",
      title: "Alertas",
      description: "Notificaciones de mantenimientos pendientes"
    }
  ]

  return (
    <ConstructionPage
      title="Mantenimiento"
      description="Desarrollando un sistema completo de gestión de mantenimiento que te permitirá programar, controlar y optimizar todas las tareas de mantenimiento de tus equipos y soportes."
      features={features}
    />
  )
}
