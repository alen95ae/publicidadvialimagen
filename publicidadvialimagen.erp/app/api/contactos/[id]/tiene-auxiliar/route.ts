import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseServer"

/** GET - Comprueba si el contacto está vinculado a algún auxiliar (contabilidad). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = params instanceof Promise ? await params : params
    if (!id) {
      return NextResponse.json({ tieneAuxiliar: false }, { status: 400 })
    }
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from("auxiliares")
      .select("id")
      .eq("contact_id", id)
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error("tiene-auxiliar:", error.message)
      return NextResponse.json({ tieneAuxiliar: false })
    }
    return NextResponse.json({ tieneAuxiliar: !!data?.id })
  } catch (e) {
    console.error("tiene-auxiliar:", e)
    return NextResponse.json({ tieneAuxiliar: false })
  }
}
