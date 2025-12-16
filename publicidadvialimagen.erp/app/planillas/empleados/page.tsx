import { redirect } from "next/navigation"

export default function EmpleadosRedirectPage() {
  // Redirigir a la ruta real dentro del panel de contabilidad
  redirect("/panel/contabilidad/planillas/empleados")
}

