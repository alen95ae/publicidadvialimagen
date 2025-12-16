import { redirect } from "next/navigation"

export default function PlanillasPage() {
  // Landing del módulo Planillas: por ahora enviamos a Datos → Cálculo (mock)
  redirect("/panel/contabilidad/planillas/calculo")
}



