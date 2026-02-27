"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/fetcher"
import type { Cuenta } from "@/lib/types/contabilidad"

interface CuentaContableSelectProps {
  value: string
  onChange: (cuentaCodigo: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CuentaContableSelect({
  value,
  onChange,
  placeholder = "Seleccionar cuenta...",
  disabled = false,
  className,
}: CuentaContableSelectProps) {
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [filteredCuentas, setFilteredCuentas] = useState<Cuenta[]>([])

  useEffect(() => {
    let cancelled = false
    async function fetchCuentas() {
      setLoading(true)
      try {
        const response = await api("/api/contabilidad/cuentas?limit=10000")
        const data = await response.json()
        if (!cancelled && data?.data) {
          setCuentas(data.data)
          setFilteredCuentas((data.data as Cuenta[]).slice(0, 20))
        }
      } catch (error) {
        console.error("Error fetching cuentas:", error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCuentas()
    return () => { cancelled = true }
  }, [])

  const filtrar = (searchValue: string) => {
    if (!searchValue?.trim()) {
      setFilteredCuentas(cuentas.slice(0, 20))
      return
    }
    const search = searchValue.toLowerCase().trim()
    const filtered = cuentas.filter(
      (c) =>
        (c.cuenta || "").toLowerCase().startsWith(search) ||
        (c.descripcion || "").toLowerCase().includes(search)
    ).slice(0, 20)
    setFilteredCuentas(filtered)
  }

  const displayText = (() => {
    if (!value?.trim()) return placeholder
    const codigo = String(value).trim()
    const cuenta = cuentas.find((c) => String(c.cuenta || "").trim() === codigo)
    if (cuenta) return `${cuenta.cuenta} - ${cuenta.descripcion}`
    return codigo
  })()

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setFilteredCuentas(cuentas.slice(0, 20))
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled || loading}
          className={cn(
            "h-9 w-full justify-between text-sm overflow-hidden font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate block text-left flex-1">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false} className="overflow-visible">
          <CommandInput
            placeholder="Buscar por código o descripción..."
            className="h-9 border-0 focus:ring-0"
            onValueChange={filtrar}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Cargando..." : "No se encontraron cuentas."}
            </CommandEmpty>
            {filteredCuentas.length > 0 && (
              <CommandGroup>
                {filteredCuentas.map((cuenta) => (
                  <CommandItem
                    key={cuenta.id}
                    value={`${cuenta.cuenta} ${cuenta.descripcion}`}
                    onSelect={() => {
                      onChange(cuenta.cuenta)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === cuenta.cuenta ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{cuenta.cuenta}</span>
                      <span className="text-gray-600 truncate">{cuenta.descripcion}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
