import { NextResponse } from "next/server"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { getEmployees } from "@/lib/calendar-api"

// GET - Obtener todos los empleados
export async function GET() {
  try {
    const { isAuthenticated } = getKindeServerSession()
    const authed = await isAuthenticated()
    
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employees = await getEmployees()
    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Error fetching employees" }, { status: 500 })
  }
}

