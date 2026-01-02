"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TransaccionBS {
  id: number
  tipo_transaccion: string
  fecha: string
  depreciacion_acumulada: number
  depreciacion_periodo: number
  depreciacion_acumulada_actual: number
  valor_neto: number
  actualizacion_valor_neto: number
  valor_neto_actual: number
  vida_util_restante: number
}

export default function ActivoTransaccionesBSTab() {
  const [transacciones] = useState<TransaccionBS[]>([
    {
      id: 1,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-01-31",
      depreciacion_acumulada: 0,
      depreciacion_periodo: 416.67,
      depreciacion_acumulada_actual: 416.67,
      valor_neto: 5000.00,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 4583.33,
      vida_util_restante: 11,
    },
    {
      id: 2,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-02-28",
      depreciacion_acumulada: 416.67,
      depreciacion_periodo: 416.67,
      depreciacion_acumulada_actual: 833.34,
      valor_neto: 4583.33,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 4166.66,
      vida_util_restante: 10,
    },
    {
      id: 3,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-03-31",
      depreciacion_acumulada: 833.34,
      depreciacion_periodo: 416.67,
      depreciacion_acumulada_actual: 1250.01,
      valor_neto: 4166.66,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 3749.99,
      vida_util_restante: 9,
    },
    {
      id: 4,
      tipo_transaccion: "Actualización",
      fecha: "2025-03-31",
      depreciacion_acumulada: 1250.01,
      depreciacion_periodo: 0,
      depreciacion_acumulada_actual: 1250.01,
      valor_neto: 3749.99,
      actualizacion_valor_neto: 250.00,
      valor_neto_actual: 3999.99,
      vida_util_restante: 9,
    },
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones en Bolivianos</CardTitle>
        <CardDescription>
          Historial de transacciones y depreciaciones del activo en moneda nacional
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Tipo de Transacción</TableHead>
                <TableHead className="w-32">Fecha</TableHead>
                <TableHead className="w-40 text-right">Depreciación Acumulada</TableHead>
                <TableHead className="w-40 text-right">Depreciación del Periodo</TableHead>
                <TableHead className="w-40 text-right">Depreciación Acumulada Actual</TableHead>
                <TableHead className="w-32 text-right">Valor Neto</TableHead>
                <TableHead className="w-40 text-right">Actualización Valor Neto</TableHead>
                <TableHead className="w-40 text-right">Valor Neto Actual</TableHead>
                <TableHead className="w-32 text-right">Vida Útil Restante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    No hay transacciones registradas
                  </TableCell>
                </TableRow>
              ) : (
                transacciones.map((transaccion) => (
                  <TableRow key={transaccion.id}>
                    <TableCell>{transaccion.tipo_transaccion}</TableCell>
                    <TableCell>
                      {new Date(transaccion.fecha).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.depreciacion_acumulada.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.depreciacion_periodo.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.depreciacion_acumulada_actual.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.valor_neto.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.actualizacion_valor_neto.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {transaccion.valor_neto_actual.toLocaleString("es-ES", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {transaccion.vida_util_restante} meses
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}






