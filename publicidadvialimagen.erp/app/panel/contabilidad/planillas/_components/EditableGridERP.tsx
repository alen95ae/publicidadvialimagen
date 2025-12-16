"use client"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type ERPColumnType = "text" | "number" | "date" | "select"

export interface SelectOption {
  value: string
  label: string
}

export interface ERPGridColumn<T> {
  key: keyof T
  label: string
  width?: number
  type?: ERPColumnType
  readonly?: boolean
  options?: SelectOption[] // for select
  align?: "left" | "right" | "center"
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

interface Props<T extends Record<string, any>> {
  rows: T[]
  columns: ERPGridColumn<T>[]
  onChange: (rows: T[]) => void
  readonly?: boolean
  maxHeight?: number
  rowKey?: (row: T, index: number) => string
  rowClassName?: (row: T) => string | undefined
}

export default function EditableGridERP<T extends Record<string, any>>({
  rows,
  columns,
  onChange,
  readonly = false,
  maxHeight = 520,
  rowKey,
  rowClassName,
}: Props<T>) {
  const updateCell = (rowIndex: number, key: keyof T, value: any) => {
    const next = rows.map((r, idx) => (idx === rowIndex ? { ...r, [key]: value } : r))
    onChange(next)
  }

  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left"

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <div style={{ maxHeight }} className="overflow-y-auto">
          <Table className="bg-white">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-gray-100">
                {columns.map((c) => (
                  <TableHead
                    key={String(c.key)}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn("text-gray-700 font-semibold", alignClass(c.align))}
                  >
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow
                  key={rowKey ? rowKey(row, rowIndex) : String(rowIndex)}
                  className={cn("hover:bg-gray-50", rowClassName?.(row))}
                >
                  {columns.map((col) => {
                    const value = row[col.key]
                    const disabled = readonly || col.readonly
                    const cellAlign = alignClass(col.align)

                    if (col.type === "select") {
                      const opts = col.options || []
                      return (
                        <TableCell key={String(col.key)} className={cn("min-w-[170px]", cellAlign)}>
                          <Select
                            value={String(value ?? "")}
                            onValueChange={(v) => updateCell(rowIndex, col.key, v)}
                            disabled={disabled}
                          >
                            <SelectTrigger className={cn(disabled ? "bg-gray-50" : "")}>
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                            <SelectContent>
                              {opts.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )
                    }

                    if (col.type === "date") {
                      return (
                        <TableCell key={String(col.key)} className={cn("min-w-[150px]", cellAlign)}>
                          <Input
                            type="date"
                            value={String(value ?? "")}
                            onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                            disabled={disabled}
                            className={cn(disabled ? "bg-gray-50" : "")}
                          />
                        </TableCell>
                      )
                    }

                    if (col.type === "number") {
                      const numeric = typeof value === "number" ? value : 0
                      return (
                        <TableCell key={String(col.key)} className={cn("min-w-[150px]", cellAlign)}>
                          <Input
                            inputMode="decimal"
                            value={disabled ? formatNumberForDisplay(numeric) : String(numeric)}
                            onChange={(e) => updateCell(rowIndex, col.key, parseNumber(e.target.value))}
                            disabled={disabled}
                            className={cn("text-right", disabled ? "bg-gray-50" : "")}
                          />
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell key={String(col.key)} className={cn("min-w-[190px]", cellAlign)}>
                        <Input
                          value={String(value ?? "")}
                          onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                          disabled={disabled}
                          className={cn(disabled ? "bg-gray-50" : "")}
                        />
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-gray-500 py-10">
                    No hay registros cargados
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


