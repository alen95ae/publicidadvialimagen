import { redirect } from "next/navigation"

export default function PlanillasCalculoPublicRoute() {
  // Ruta solicitada: /planillas/calculo
  // En este ERP vive dentro del panel protegido:
  redirect("/panel/contabilidad/planillas/calculo")
}


