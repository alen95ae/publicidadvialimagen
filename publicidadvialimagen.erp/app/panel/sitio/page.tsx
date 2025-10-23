import ConstructionPage from "@/components/construction-page"

export default function SitioPage() {
  const features = [
    {
      iconName: "globe",
      title: "Gestión Web",
      description: "Control completo del contenido del sitio web"
    },
    {
      iconName: "edit",
      title: "Editor",
      description: "Editor visual para modificar páginas y contenido"
    },
    {
      iconName: "settings",
      title: "Configuración",
      description: "Ajustes SEO, dominio y configuraciones técnicas"
    }
  ]

  return (
    <ConstructionPage
      title="Sitio Web"
      description="Desarrollando un módulo de gestión web completo que te permitirá administrar todo el contenido de tu sitio web, desde páginas hasta configuraciones SEO y técnicas."
      features={features}
    />
  )
}