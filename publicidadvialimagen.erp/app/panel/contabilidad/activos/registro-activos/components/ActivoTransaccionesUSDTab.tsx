"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TransaccionUSD {
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

export default function ActivoTransaccionesUSDTab() {
  const [transacciones] = useState<TransaccionUSD[]>([
    {
      id: 1,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-01-31",
      depreciacion_acumulada: 0,
      depreciacion_periodo: 60.00,
      depreciacion_acumulada_actual: 60.00,
      valor_neto: 720.00,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 660.00,
      vida_util_restante: 11,
    },
    {
      id: 2,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-02-28",
      depreciacion_acumulada: 60.00,
      depreciacion_periodo: 60.00,
      depreciacion_acumulada_actual: 120.00,
      valor_neto: 660.00,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 600.00,
      vida_util_restante: 10,
    },
    {
      id: 3,
      tipo_transaccion: "Depreciación Mensual",
      fecha: "2025-03-31",
      depreciacion_acumulada: 120.00,
      depreciacion_periodo: 60.00,
      depreciacion_acumulada_actual: 180.00,
      valor_neto: 600.00,
      actualizacion_valor_neto: 0,
      valor_neto_actual: 540.00,
      vida_util_restante: 9,
    },
    {
      id: 4,
      tipo_transaccion: "Actualización",
      fecha: "2025-03-31",
      depreciacion_acumulada: 180.00,
      depreciacion_periodo: 0,
      depreciacion_acumulada_actual: 180.00,
      valor_neto: 540.00,
      actualizacion_valor_neto: 36.00,
      valor_neto_actual: 576.00,
      vida_util_restante: 9,
    },
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones en USD</CardTitle>
        <CardDescription>
          Historial de transacciones y depreciaciones del activo en dólares
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






