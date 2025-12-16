"use client"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type ColumnType = "text" | "number" | "time"

export interface GridColumn<T> {
  key: keyof T
  label: string
  width?: number
  type?: ColumnType
  readonly?: boolean
}

function formatNumberForDisplay(value: number) {
  if (Number.isNaN(value)) return ""
  return new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

function parseNumber(value: string) {
  const cleaned = value.replace(/\./g, "").replace(",", ".")
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

interface Props<T extends { codigo_empleado: string; nombre_empleado: string }> {
  rows: T[]
  columns: GridColumn<T>[]
  onChange: (rows: T[]) => void
  readonly?: boolean
  maxHeight?: number
}

export default function EditableEmpleadoTabla<T extends { codigo_empleado: string; nombre_empleado: string }>({
  rows,
  columns,
  onChange,
  readonly = false,
  maxHeight = 520,
}: Props<T>) {
  const updateCell = (rowIndex: number, key: keyof T, value: any) => {
    const next = rows.map((r, idx) => (idx === rowIndex ? { ...r, [key]: value } : r))
    onChange(next)
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ maxHeight }} className="overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={String(c.key)} style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow key={`${row.codigo_empleado}-${rowIndex}`}>
                  {columns.map((col) => {
                    const value = row[col.key]
                    const disabled = readonly || col.readonly

                    if (col.type === "number") {
                      const numeric = typeof value === "number" ? value : 0
                      return (
                        <TableCell key={String(col.key)} className="min-w-[140px]">
                          <Input
                            inputMode="decimal"
                            value={disabled ? formatNumberForDisplay(numeric) : String(numeric)}
                            onChange={(e) => updateCell(rowIndex, col.key, parseNumber(e.target.value))}
                            disabled={disabled}
                            className="text-right"
                          />
                        </TableCell>
                      )
                    }

                    if (col.type === "time") {
                      return (
                        <TableCell key={String(col.key)} className="min-w-[130px]">
                          <Input
                            value={String(value ?? "")}
                            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                            disabled={disabled}
                            placeholder="hh:mm"
                          />
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell key={String(col.key)} className="min-w-[180px]">
                        <Input
                          value={String(value ?? "")}
                          onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                          disabled={disabled}
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-gray-500 py-10">
                    No hay empleados cargados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}


