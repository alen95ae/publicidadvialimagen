"use client"

import { Construction, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface ConstructionPageProps {
  title: string
  description: string
  features: Array<{
    iconName: string
    title: string
    description: string
  }>
}

export default function ConstructionPage({ title, description, features }: ConstructionPageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container px-4 py-12 md:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Icono de construcción */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative bg-primary/10 p-8 rounded-full">
                <Construction className="h-24 w-24 text-primary animate-pulse" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Página en Construcción
            </p>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Características que vendrán */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="h-8 w-8 text-primary flex items-center justify-center">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botón de regreso */}
          <div className="pt-8">
            <Button asChild size="lg" className="gap-2">
              <Link href="/panel">
                <ArrowLeft className="h-5 w-5" />
                Volver al Panel
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
