// app/api/form/simple/route.ts
import { NextResponse } from "next/server"
import { saveToAirtableSimple } from "./service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nombre = (body?.nombre ?? "").toString()
    const email = (body?.email ?? "").toString()
    const telefono = (body?.telefono ?? "").toString()
    const empresa = (body?.empresa ?? "").toString()

    if (!email) {
      return NextResponse.json({ error: "Email es obligatorio" }, { status: 400 })
    }

    const result = await saveToAirtableSimple({ nombre, email, telefono, empresa })
    return NextResponse.json({ success: true, ...result }, { status: 200 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message || "Error inesperado" }, { status: 500 })
  }
}


