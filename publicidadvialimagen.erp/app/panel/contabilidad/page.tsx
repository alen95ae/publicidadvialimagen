import { redirect } from "next/navigation"

export default function ContabilidadPage() {
  // Redirigir directamente al módulo de Plan de Cuentas
  redirect("/panel/contabilidad/plan-cuentas")
}