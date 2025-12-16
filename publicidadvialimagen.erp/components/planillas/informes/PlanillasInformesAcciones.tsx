"use client"

import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface Props {
  onGenerar: () => void
  label?: string
}

export default function PlanillasInformesAcciones({ onGenerar, label = "Generar Reporte" }: Props) {
  return (
    <div className="flex justify-end">
      <Button onClick={onGenerar} className="gap-2">
        <FileText className="h-4 w-4" />
        {label}
      </Button>
    </div>
  )
}


