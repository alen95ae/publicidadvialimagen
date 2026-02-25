"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Filter, ChevronDown, MapPin, X, FileSpreadsheet, FileDown, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { api } from "@/lib/fetcher";
import { normalizeText } from "@/lib/utils";
import { PermisoEditar } from "@/components/permiso";
import { usePermisosContext } from "@/hooks/permisos-provider";
import type { SoportePreciosRow } from "@/app/api/soportes/precios/route";

type SortColumn =
  | "codigo"
  | "titulo"
  | "costeTotal"
  | "precio_1_mes"
  | "utilidad_1_mes"
  | "precio_3_meses"
  | "utilidad_3_meses"
  | "precio_6_meses"
  | "utilidad_6_meses"
  | "precio_12_meses"
  | "utilidad_12_meses"
  | null;

const STATUS_META = {
  "Disponible": { label: "Disponible", className: "bg-green-100 text-green-800" },
  "Reservado": { label: "Reservado", className: "bg-yellow-100 text-yellow-800" },
  "Ocupado": { label: "Ocupado", className: "bg-red-100 text-red-800" },
  "No disponible": { label: "No disponible", className: "bg-gray-100 text-gray-800" },
  "A Consultar": { label: "A Consultar", className: "bg-blue-100 text-blue-800" },
} as const;

const ciudadesBolivia = ["La Paz", "Santa Cruz", "Cochabamba", "El Alto", "Sucre", "Potosi", "Tarija", "Oruro", "Beni", "Pando"];

const STORAGE_KEY = "soportes_precios_filtros";
const LIMIT = 50;

function n(val: number | string | null): number {
  if (val == null) return 0;
  const num = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(num) ? num : 0;
}

// Coste base estructural (sin impuestos). Igual para todos los escenarios.
function costeBase(row: SoportePreciosRow): number {
  return round2(
    n(row.coste_alquiler) +
    n(row.patentes) +
    n(row.uso_suelos) +
    n(row.luz) +
    n(row.gastos_administrativos) +
    n(row.comision_ejecutiva) +
    n(row.mantenimiento)
  );
}

// Coste total para un escenario: costeBase + impuestos 18% sobre el precio de ESE escenario.
// Cada columna (1 mes, 3, 6, 12) usa su propio precio para impuestos.
function costeTotalParaEscenario(row: SoportePreciosRow, precioEscenario: number): number {
  const base = costeBase(row);
  const impuestosEscenario = round2(precioEscenario * 0.18);
  return round2(base + impuestosEscenario);
}

// Coste Total mostrado en columna = escenario 1 mes (precio_mensual).
function costeTotal(row: SoportePreciosRow): number {
  return costeTotalParaEscenario(row, n(row.precio_mensual));
}

function utilidadPct(precio: number | null, costeTotalVal: number): number {
  if (precio == null || precio <= 0) return 0;
  return ((precio - costeTotalVal) / precio) * 100;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatearBs(num: number): string {
  const [parteEntera, parteDecimal] = num.toFixed(2).split(".");
  const conMiles = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conMiles},${parteDecimal}`;
}

function getUtilidadColor(pct: number): string {
  if (pct >= 30) return "text-green-600 font-medium";
  if (pct >= 10) return "text-yellow-600 font-medium";
  return "text-red-600 font-medium";
}

type EditedPrices = { precio_3_meses?: number | null; precio_6_meses?: number | null; precio_12_meses?: number | null };

export default function PreciosPage() {
  const { puedeEditar } = usePermisosContext();
  const [data, setData] = useState<SoportePreciosRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [openCiudad, setOpenCiudad] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editedRows, setEditedRows] = useState<Record<string, EditedPrices>>({});
  const [savingChanges, setSavingChanges] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const f = JSON.parse(saved);
        setQ(f.q ?? "");
        setSearchQuery(f.q ?? "");
        setStatusFilter(f.statusFilter ?? []);
        setCityFilter(f.cityFilter ?? "");
        setSortColumn(f.sortColumn ?? null);
        setSortDirection(f.sortDirection ?? "asc");
      } catch {
        // ignore
      }
    }
    setFiltersLoaded(true);
  }, []);

  useEffect(() => {
    if (!filtersLoaded) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        q: searchQuery,
        statusFilter,
        cityFilter,
        sortColumn,
        sortDirection,
      })
    );
  }, [searchQuery, statusFilter, cityFilter, sortColumn, sortDirection, filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded) return;
    const timer = setTimeout(() => setSearchQuery(q), 300);
    return () => clearTimeout(timer);
  }, [q, filtersLoaded]);

  useEffect(() => {
    if (!filtersLoaded) return;
    setCurrentPage(1);
    let cancelled = false;
    async function fetchPrecios() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter.length) params.set("status", statusFilter.join(","));
        if (cityFilter) params.set("city", cityFilter);
        const res = await fetch(`/api/soportes/precios?${params}`);
        if (!res.ok) throw new Error("Error al cargar precios");
        const json = await res.json();
        if (!cancelled) setData(json.data || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPrecios();
    return () => {
      cancelled = true;
    };
  }, [filtersLoaded, statusFilter, cityFilter]);

  const limpiarTodosFiltros = () => {
    setQ("");
    setSearchQuery("");
    setStatusFilter([]);
    setCityFilter("");
    setSortColumn(null);
    setSortDirection("asc");
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const eliminarFiltro = (tipo: "busqueda" | "estado" | "ciudad" | "orden") => {
    if (tipo === "busqueda") {
      setQ("");
      setSearchQuery("");
    }
    if (tipo === "estado") setStatusFilter([]);
    if (tipo === "ciudad") setCityFilter("");
    if (tipo === "orden") {
      setSortColumn(null);
      setSortDirection("asc");
    }
  };

  const filteredData = (() => {
    if (!searchQuery.trim()) return data;
    const normalizedQuery = normalizeText(searchQuery.trim());
    return data.filter((row) => {
      const code = normalizeText(row.codigo ?? "");
      const title = normalizeText(row.titulo ?? "");
      const city = normalizeText(row.ciudad ?? "");
      return code.includes(normalizedQuery) || title.includes(normalizedQuery) || city.includes(normalizedQuery);
    });
  })();

  const sortedData = (() => {
    if (!sortColumn) return filteredData;
    const parseCode = (code: string) => {
      const parts = (code || "").split("-");
      const numberPart = parts[0] ? parseInt(parts[0], 10) : 0;
      const letterPart = parts[1] ? parts[1].toLowerCase() : "";
      return { number: isNaN(numberPart) ? 0 : numberPart, letters: letterPart };
    };
    return [...filteredData].sort((a, b) => {
      const ctA = costeTotal(a);
      const ctB = costeTotal(b);
      const u1A = utilidadPct(a.precio_mensual, costeTotalParaEscenario(a, n(a.precio_mensual)));
      const u1B = utilidadPct(b.precio_mensual, costeTotalParaEscenario(b, n(b.precio_mensual)));
      const u3A = utilidadPct(a.precio_3_meses, costeTotalParaEscenario(a, n(a.precio_3_meses)));
      const u3B = utilidadPct(b.precio_3_meses, costeTotalParaEscenario(b, n(b.precio_3_meses)));
      const u6A = utilidadPct(a.precio_6_meses, costeTotalParaEscenario(a, n(a.precio_6_meses)));
      const u6B = utilidadPct(b.precio_6_meses, costeTotalParaEscenario(b, n(b.precio_6_meses)));
      const u12A = utilidadPct(a.precio_12_meses, costeTotalParaEscenario(a, n(a.precio_12_meses)));
      const u12B = utilidadPct(b.precio_12_meses, costeTotalParaEscenario(b, n(b.precio_12_meses)));
      const dir = sortDirection === "asc" ? 1 : -1;
      let cmp = 0;
      switch (sortColumn) {
        case "codigo": {
          const ap = parseCode(a.codigo ?? "");
          const bp = parseCode(b.codigo ?? "");
          if (ap.number !== bp.number) cmp = ap.number - bp.number;
          else if (ap.letters < bp.letters) cmp = -1;
          else if (ap.letters > bp.letters) cmp = 1;
          break;
        }
        case "titulo":
          cmp = (a.titulo ?? "").localeCompare(b.titulo ?? "");
          break;
        case "costeTotal":
          cmp = ctA - ctB;
          break;
        case "precio_1_mes":
          cmp = (a.precio_mensual ?? 0) - (b.precio_mensual ?? 0);
          break;
        case "utilidad_1_mes":
          cmp = u1A - u1B;
          break;
        case "precio_3_meses":
          cmp = (a.precio_3_meses ?? 0) - (b.precio_3_meses ?? 0);
          break;
        case "utilidad_3_meses":
          cmp = u3A - u3B;
          break;
        case "precio_6_meses":
          cmp = (a.precio_6_meses ?? 0) - (b.precio_6_meses ?? 0);
          break;
        case "utilidad_6_meses":
          cmp = u6A - u6B;
          break;
        case "precio_12_meses":
          cmp = (a.precio_12_meses ?? 0) - (b.precio_12_meses ?? 0);
          break;
        case "utilidad_12_meses":
          cmp = u12A - u12B;
          break;
        default:
          break;
      }
      return cmp * dir;
    });
  })();

  const total = sortedData.length;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const start = (currentPage - 1) * LIMIT;
  const paginatedData = sortedData.slice(start, start + LIMIT);
  const computedPagination = {
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortLabel: Record<NonNullable<SortColumn>, string> = {
    codigo: "Código",
    titulo: "Título",
    costeTotal: "Coste Total",
    precio_1_mes: "Precio 1 mes",
    utilidad_1_mes: "% Utilidad (1 mes)",
    precio_3_meses: "Precio 3 meses",
    utilidad_3_meses: "% Utilidad (3 meses)",
    precio_6_meses: "Precio 6 meses",
    utilidad_6_meses: "% Utilidad (6 meses)",
    precio_12_meses: "Precio 12 meses",
    utilidad_12_meses: "% Utilidad (12 meses)",
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelected({});
  };
  const handlePrevPage = () => {
    if (computedPagination.hasPrev) handlePageChange(currentPage - 1);
  };
  const handleNextPage = () => {
    if (computedPagination.hasNext) handlePageChange(currentPage + 1);
  };

  const hasActiveFilters = statusFilter.length > 0 || cityFilter || !!searchQuery || !!sortColumn;

  const selectedIds = paginatedData.filter((r) => selected[String(r.id)]).map((r) => String(r.id));
  const selectedCount = selectedIds.length;
  const hasEdited = Object.keys(editedRows).length > 0;

  const handleFieldChange = (id: number, field: keyof EditedPrices, value: string) => {
    const sid = String(id);
    const parsed = value === "" || value === null ? null : parseFloat(String(value));
    const num = parsed === null || isNaN(parsed) || parsed === 0 ? null : parsed;
    setEditedRows((prev) => ({
      ...prev,
      [sid]: { ...prev[sid], [field]: num },
    }));
  };

  const handleSaveChanges = async () => {
    if (!hasEdited) return;
    setSavingChanges(true);
    try {
      let okCount = 0;
      for (const id of Object.keys(editedRows)) {
        const changes = editedRows[id];
        if (!changes || Object.keys(changes).length === 0) continue;
        const res = await fetch(`/api/soportes/${id}`);
        if (!res.ok) continue;
        const support = await res.json();
        const updated = {
          ...support,
          price3Months: changes.precio_3_meses !== undefined ? changes.precio_3_meses : (support.price3Months ?? support.precio_3_meses),
          price6Months: changes.precio_6_meses !== undefined ? changes.precio_6_meses : (support.price6Months ?? support.precio_6_meses),
          price12Months: changes.precio_12_meses !== undefined ? changes.precio_12_meses : (support.price12Months ?? support.precio_12_meses),
        };
        const putRes = await api(`/api/soportes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (putRes.ok) okCount++;
      }
      setEditedRows({});
      setSelected({});
      toast.success(`${okCount} soporte(s) actualizado(s)`);
      if (filtersLoaded) {
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (statusFilter.length) params.set("status", statusFilter.join(","));
        if (cityFilter) params.set("city", cityFilter);
        const res = await fetch(`/api/soportes/precios?${params}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data || []);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar cambios");
    } finally {
      setSavingChanges(false);
    }
  };

  const handleDiscardChanges = () => {
    setEditedRows({});
    toast.info("Cambios descartados");
  };

  const allSelected = paginatedData.length > 0 && paginatedData.every((r) => selected[String(r.id)]);
  const toggleAll = (checked: boolean) => {
    if (checked) {
      const next: Record<string, boolean> = {};
      paginatedData.forEach((r) => {
        next[String(r.id)] = true;
      });
      setSelected(next);
    } else {
      setSelected({});
    }
  };

  const handleExportXlsx = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecciona al menos un soporte");
      return;
    }
    setExportingXlsx(true);
    try {
      const response = await api(`/api/soportes/export?ids=${encodeURIComponent(selectedIds.join(","))}`);
      if (!response.ok) throw new Error("Error al exportar");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soportes_seleccionados_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Exportado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("Error al exportar");
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Precios</h1>
        <p className="text-gray-600">
          Precios por plazo y utilidad neta respecto al coste total mensual
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center mb-4 pb-4 border-b">
              {searchQuery && (
                <div className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Búsqueda:</span>
                  <span className="text-gray-700">{searchQuery}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro("busqueda")}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {statusFilter.length > 0 &&
                statusFilter.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-1 bg-green-100 hover:bg-green-200 rounded-full px-3 py-1 text-sm"
                  >
                    <span className="font-medium">Estado:</span>
                    <span className="text-gray-700">
                      {STATUS_META[status as keyof typeof STATUS_META]?.label || status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter.filter((s) => s !== status))}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              {cityFilter && (
                <div className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Ciudad:</span>
                  <span className="text-gray-700">{cityFilter}</span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro("ciudad")}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              {sortColumn && (
                <div className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 rounded-full px-3 py-1 text-sm">
                  <span className="font-medium">Orden:</span>
                  <span className="text-gray-700">
                    {sortLabel[sortColumn]} ({sortDirection === "asc" ? "A-Z" : "Z-A"})
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarFiltro("orden")}
                    className="ml-1 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={limpiarTodosFiltros}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Limpiar todo
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar código, título, ciudad..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setSearchQuery(q);
                }}
                className="pl-9 w-64"
              />
            </div>
            <Select
              value={statusFilter.length ? statusFilter.join(",") : "all"}
              onValueChange={(value) =>
                setStatusFilter(value === "all" ? [] : value ? value.split(",") : [])
              }
            >
              <SelectTrigger className="w-52 [&>span]:text-black !pl-9 !pr-3 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                <SelectValue placeholder="Disponibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Disponibilidad</SelectItem>
                {Object.entries(STATUS_META)
                  .filter(([key]) => key !== "No disponible")
                  .map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${meta.className}`} />
                        {meta.label}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Popover open={openCiudad} onOpenChange={setOpenCiudad}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCiudad}
                  className="relative w-52 justify-between !pl-9"
                >
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10 shrink-0" />
                  <span className="truncate">{cityFilter || "Ciudad"}</span>
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto">
                  <div
                    className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${!cityFilter ? "bg-accent font-medium" : ""}`}
                    onClick={() => {
                      setCityFilter("");
                      setOpenCiudad(false);
                    }}
                  >
                    Ciudad
                  </div>
                  {ciudadesBolivia.map((city) => (
                    <div
                      key={city}
                      className={`px-3 py-2 cursor-pointer hover:bg-accent text-sm ${cityFilter === city ? "bg-accent font-medium" : ""}`}
                      onClick={() => {
                        setCityFilter(city);
                        setOpenCiudad(false);
                      }}
                    >
                      {city}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {(selectedCount > 0 || hasEdited) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {selectedCount > 0 && (
                <span className="text-sm font-medium text-blue-800">
                  {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
                </span>
              )}
              {selectedCount > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportXlsx} disabled={exportingXlsx}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    {exportingXlsx ? "Exportando..." : "Exportar selección"}
                  </Button>
                </>
              )}
            </div>
            {hasEdited && (
              <div className="flex gap-2">
                <PermisoEditar modulo="soportes">
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={savingChanges}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {savingChanges ? "Guardando..." : `Guardar cambios (${Object.keys(editedRows).length})`}
                  </Button>
                </PermisoEditar>
                <Button variant="outline" size="sm" onClick={handleDiscardChanges}>
                  Descartar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Precios por soporte</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${total} soportes`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D54644] mx-auto mb-4" />
                <p className="text-gray-600">Cargando precios...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="w-10 font-medium text-gray-900 h-10 px-2 text-left align-middle">
                      <Checkbox
                        checked={paginatedData.length > 0 && allSelected}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                        aria-label="Seleccionar todo"
                      />
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-left align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort("codigo")}
                        className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                      >
                        Código
                        <ArrowUpDown className={`h-3 w-3 ${sortColumn === "codigo" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-left align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort("titulo")}
                        className="flex items-center gap-1 hover:text-[#D54644] transition-colors"
                      >
                        Título
                        <ArrowUpDown className={`h-3 w-3 ${sortColumn === "titulo" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-left align-middle whitespace-nowrap">
                      Ciudad
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-center align-middle w-10" title="Estado">
                      {" "}
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort("costeTotal")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors"
                      >
                        Coste Total
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "costeTotal" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort("precio_1_mes")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors"
                      >
                        Precio 1 mes
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "precio_1_mes" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("utilidad_1_mes")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">% Utilidad</span>{" "}
                          <span className="whitespace-nowrap">(1 mes)</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "utilidad_1_mes" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("precio_3_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">Precio</span>{" "}
                          <span className="whitespace-nowrap">3 meses</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "precio_3_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("utilidad_3_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">% Utilidad</span>{" "}
                          <span className="whitespace-nowrap">(3 meses)</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "utilidad_3_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("precio_6_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">Precio</span>{" "}
                          <span className="whitespace-nowrap">6 meses</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "precio_6_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("utilidad_6_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">% Utilidad</span>{" "}
                          <span className="whitespace-nowrap">(6 meses)</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "utilidad_6_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("precio_12_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">Precio</span>{" "}
                          <span className="whitespace-nowrap">12 meses</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "precio_12_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-medium text-gray-900 h-10 px-2 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("utilidad_12_meses")}
                        className="flex items-center gap-1 ml-auto hover:text-[#D54644] transition-colors text-left w-full"
                      >
                        <span className="whitespace-normal break-words block text-sm">
                          <span className="whitespace-nowrap">% Utilidad</span>{" "}
                          <span className="whitespace-nowrap">(12 meses)</span>
                        </span>
                        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortColumn === "utilidad_12_meses" ? "text-[#D54644]" : "text-gray-400"}`} />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-gray-500 p-2">
                        No hay soportes
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row) => {
                      const sid = String(row.id);
                      const isSelected = !!selected[sid];
                      const edited = editedRows[sid];
                      const p3 = edited?.precio_3_meses !== undefined ? edited.precio_3_meses : row.precio_3_meses;
                      const p6 = edited?.precio_6_meses !== undefined ? edited.precio_6_meses : row.precio_6_meses;
                      const p12 = edited?.precio_12_meses !== undefined ? edited.precio_12_meses : row.precio_12_meses;
                      const p1 = n(row.precio_mensual);
                      const ct = costeTotal(row);
                      const ct1 = costeTotalParaEscenario(row, p1);
                      const ct3 = costeTotalParaEscenario(row, n(p3));
                      const ct6 = costeTotalParaEscenario(row, n(p6));
                      const ct12 = costeTotalParaEscenario(row, n(p12));
                      const u1 = utilidadPct(row.precio_mensual, ct1);
                      const u3 = utilidadPct(p3, ct3);
                      const u6 = utilidadPct(p6, ct6);
                      const u12 = utilidadPct(p12, ct12);
                      const canEdit = isSelected && puedeEditar("soportes");
                      return (
                        <TableRow
                          key={row.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell className="w-10 p-2 align-middle">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(v) =>
                                setSelected((prev) => ({ ...prev, [sid]: Boolean(v) }))
                              }
                              aria-label={`Seleccionar ${row.codigo}`}
                            />
                          </TableCell>
                          <TableCell className="p-2 align-middle whitespace-nowrap">
                            <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-gray-800 border border-neutral-200">
                              {row.codigo ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="p-2 align-middle max-w-[200px] text-sm">
                            {(row.titulo ?? "").length > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate cursor-default">
                                      {row.titulo}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-sm break-words">
                                    {row.titulo}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="p-2 align-middle">
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3" />
                              {row.ciudad ?? "—"}
                            </div>
                          </TableCell>
                          <TableCell className="p-2 align-middle text-center w-10">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${STATUS_META[row.estado as keyof typeof STATUS_META]?.className ?? "bg-gray-100"}`}
                              title={row.estado ?? ""}
                            />
                          </TableCell>
                          <TableCell className="p-2 align-middle text-right tabular-nums text-sm">
                            {formatearBs(ct)} Bs
                          </TableCell>
                          <TableCell className="p-2 align-middle text-right tabular-nums text-sm">
                            {row.precio_mensual != null ? `${formatearBs(row.precio_mensual)} Bs` : "—"}
                          </TableCell>
                          <TableCell className={`p-2 align-middle text-right tabular-nums text-sm ${getUtilidadColor(u1)}`}>
                            <div className="flex flex-col justify-end">
                              <span>{u1.toFixed(1)}%</span>
                              <span className="text-xs mt-0.5">Bs {formatearBs(row.precio_mensual == null || row.precio_mensual <= 0 ? 0 : round2(row.precio_mensual - ct1))}</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 align-middle text-right tabular-nums text-sm">
                            {canEdit ? (
                              <Input
                                type="number"
                                className="h-8 w-24 text-right tabular-nums"
                                value={p3 ?? ""}
                                onChange={(e) => handleFieldChange(row.id, "precio_3_meses", e.target.value)}
                                placeholder="—"
                              />
                            ) : (
                              p3 != null ? `${formatearBs(p3)} Bs` : "—"
                            )}
                          </TableCell>
                          <TableCell className={`p-2 align-middle text-right tabular-nums text-sm ${getUtilidadColor(u3)}`}>
                            <div className="flex flex-col justify-end">
                              <span>{u3.toFixed(1)}%</span>
                              <span className="text-xs mt-0.5">Bs {formatearBs(p3 == null || p3 <= 0 ? 0 : round2(p3 - ct3))}</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 align-middle text-right tabular-nums text-sm">
                            {canEdit ? (
                              <Input
                                type="number"
                                className="h-8 w-24 text-right tabular-nums"
                                value={p6 ?? ""}
                                onChange={(e) => handleFieldChange(row.id, "precio_6_meses", e.target.value)}
                                placeholder="—"
                              />
                            ) : (
                              p6 != null ? `${formatearBs(p6)} Bs` : "—"
                            )}
                          </TableCell>
                          <TableCell className={`p-2 align-middle text-right tabular-nums text-sm ${getUtilidadColor(u6)}`}>
                            <div className="flex flex-col justify-end">
                              <span>{u6.toFixed(1)}%</span>
                              <span className="text-xs mt-0.5">Bs {formatearBs(p6 == null || p6 <= 0 ? 0 : round2(p6 - ct6))}</span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 align-middle text-right tabular-nums text-sm">
                            {canEdit ? (
                              <Input
                                type="number"
                                className="h-8 w-24 text-right tabular-nums"
                                value={p12 ?? ""}
                                onChange={(e) => handleFieldChange(row.id, "precio_12_meses", e.target.value)}
                                placeholder="—"
                              />
                            ) : (
                              p12 != null ? `${formatearBs(p12)} Bs` : "—"
                            )}
                          </TableCell>
                          <TableCell className={`p-2 align-middle text-right tabular-nums text-sm ${getUtilidadColor(u12)}`}>
                            <div className="flex flex-col justify-end">
                              <span>{u12.toFixed(1)}%</span>
                              <span className="text-xs mt-0.5">Bs {formatearBs(p12 == null || p12 <= 0 ? 0 : round2(p12 - ct12))}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && !error && computedPagination.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!computedPagination.hasPrev || loading}
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, computedPagination.totalPages) }, (_, i) => {
              let pageNum: number;
              if (computedPagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= computedPagination.totalPages - 2) {
                pageNum = computedPagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                  className={currentPage === pageNum ? "bg-[#D54644] text-white hover:bg-[#B73E3A]" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!computedPagination.hasNext || loading}
            >
              Siguiente
            </Button>
            <div className="ml-4 text-sm text-gray-600">
              Mostrando {(currentPage - 1) * LIMIT + 1} -{" "}
              {Math.min(currentPage * LIMIT, computedPagination.total)} de{" "}
              {computedPagination.total} items
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
