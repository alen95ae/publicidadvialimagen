import { Metadata } from "next"
import RegistroEmpleadosPage from "./components/RegistroEmpleadosPage"

export const metadata: Metadata = {
  title: "Registro de Empleados | Planillas",
  description: "Gestión de empleados con datos generales, contratos, complementarios y dependientes"
}

export default function EmpleadosPage() {
  return <RegistroEmpleadosPage />
}

