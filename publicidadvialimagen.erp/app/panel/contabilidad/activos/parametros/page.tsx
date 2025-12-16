import { redirect } from "next/navigation"

export default function ActivosParametrosPage({
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  // Esta ruta solo actúa como "landing" para Parámetros de Activos.
  // Las subsecciones reales viven como rutas separadas en el menú:
  // - /grupos-activos-fijos
  // - /gestiones-depreciacion-activos
  redirect("/panel/contabilidad/activos/parametros/grupos-activos-fijos")
}


