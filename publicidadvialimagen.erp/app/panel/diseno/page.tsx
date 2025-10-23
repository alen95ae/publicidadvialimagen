import ConstructionPage from "@/components/construction-page"

export default function DisenoPage() {
  const features = [
    {
      iconName: "palette",
      title: "Editor Gráfico",
      description: "Herramientas profesionales de diseño y edición"
    },
    {
      iconName: "image",
      title: "Gestión de Assets",
      description: "Biblioteca de imágenes, logos y recursos gráficos"
    },
    {
      iconName: "layers",
      title: "Plantillas",
      description: "Plantillas predefinidas para diseños comunes"
    }
  ]

  return (
    <ConstructionPage
      title="Diseño Gráfico"
      description="Desarrollando un módulo completo de diseño gráfico que incluirá herramientas de edición, gestión de assets, plantillas y todo lo necesario para crear diseños profesionales."
      features={features}
    />
  )
}