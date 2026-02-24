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
import type { SoportePreciosRow } from "@/app/api/soportes/precios/route";

function n(val: number | null): number {
  return val != null && Number.isFinite(val) ? val : 0;
}

function costeTotal(row: SoportePreciosRow): number {
  return (
    n(row.coste_alquiler) +
    n(row.patentes) +
    n(row.uso_suelos) +
    n(row.gastos_administrativos) +
    n(row.comision_ejecutiva) +
    n(row.mantenimiento)
  );
}

function utilidadPct(precio: number | null, costeTotalVal: number): number {
  if (precio == null || precio <= 0) return 0;
  return ((precio - costeTotalVal) / precio) * 100;
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

export default function PreciosPage() {
  const [data, setData] = useState<SoportePreciosRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPrecios() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/soportes/precios");
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
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Precios</h1>
        <p className="text-gray-600">
          Precios por plazo y utilidad neta respecto al coste total mensual
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Precios por soporte</CardTitle>
          <CardDescription>
            {loading ? "Cargando..." : `${data.length} soportes`}
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
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-medium text-gray-900">Código</TableHead>
                    <TableHead className="font-medium text-gray-900">Título</TableHead>
                    <TableHead className="font-medium text-gray-900">Ciudad</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">Coste Total</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">Precio 1 mes</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">% Utilidad (1 mes)</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">Precio 3 meses</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">% Utilidad (3 meses)</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">Precio 6 meses</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">% Utilidad (6 meses)</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">Precio 12 meses</TableHead>
                    <TableHead className="font-medium text-gray-900 text-right">% Utilidad (12 meses)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                        No hay soportes
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => {
                      const ct = costeTotal(row);
                      const u1 = utilidadPct(row.precio_mensual, ct);
                      const u3 = utilidadPct(row.precio_3_meses, ct);
                      const u6 = utilidadPct(row.precio_6_meses, ct);
                      const u12 = utilidadPct(row.precio_12_meses, ct);
                      return (
                        <TableRow key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <TableCell className="font-mono text-sm">{row.codigo ?? "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={row.titulo ?? ""}>
                            {row.titulo ?? "—"}
                          </TableCell>
                          <TableCell>{row.ciudad ?? "—"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatearBs(ct)} Bs
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.precio_mensual != null ? `${formatearBs(row.precio_mensual)} Bs` : "—"}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${getUtilidadColor(u1)}`}>
                            {u1.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.precio_3_meses != null ? `${formatearBs(row.precio_3_meses)} Bs` : "—"}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${getUtilidadColor(u3)}`}>
                            {u3.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.precio_6_meses != null ? `${formatearBs(row.precio_6_meses)} Bs` : "—"}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${getUtilidadColor(u6)}`}>
                            {u6.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.precio_12_meses != null ? `${formatearBs(row.precio_12_meses)} Bs` : "—"}
                          </TableCell>
                          <TableCell className={`text-right tabular-nums ${getUtilidadColor(u12)}`}>
                            {u12.toFixed(2)}%
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
    </div>
  );
}
