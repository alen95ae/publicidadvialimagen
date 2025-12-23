"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  PieChart,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";

// Datos para Ingresos vs Gastos
const incomeExpenseData = [
  { mes: "Ene", ingresos: 65000, gastos: 42000 },
  { mes: "Feb", ingresos: 75000, gastos: 48000 },
  { mes: "Mar", ingresos: 95000, gastos: 55000 },
  { mes: "Abr", ingresos: 110000, gastos: 62000 },
  { mes: "May", ingresos: 135000, gastos: 70000 },
  { mes: "Jun", ingresos: 155000, gastos: 78000 },
];

// Datos para Distribución por Nichos
const businessNichesData = [
  { name: "Publicidad Exterior", value: 45, color: "#ef4444" },
  { name: "Diseño Gráfico", value: 20, color: "#3b82f6" },
  { name: "Eventos", value: 15, color: "#10b981" },
  { name: "Marketing Digital", value: 20, color: "#f59e0b" },
];

// Datos para Sucursales
const branchData = [
  { sucursal: "La Paz", ventas: 125000, clientes: 1847 },
  { sucursal: "Santa Cruz", ventas: 98000, clientes: 1523 },
];

// Datos de prueba para tablas
const ventasData = [
  { id: 1, cliente: "Empresa ABC", producto: "Valla Publicitaria", monto: 15000, estado: "Completado", fecha: "2024-01-15", progreso: 100 },
  { id: 2, cliente: "Corporación XYZ", producto: "Diseño Gráfico", monto: 8500, estado: "En Proceso", fecha: "2024-01-20", progreso: 65 },
  { id: 3, cliente: "Negocio 123", producto: "Evento Corporativo", monto: 25000, estado: "Pendiente", fecha: "2024-02-01", progreso: 0 },
  { id: 4, cliente: "Marca Premium", producto: "Marketing Digital", monto: 12000, estado: "Completado", fecha: "2024-01-10", progreso: 100 },
  { id: 5, cliente: "Startup Tech", producto: "Valla Publicitaria", monto: 18000, estado: "En Proceso", fecha: "2024-01-25", progreso: 40 },
];

const productosData = [
  { id: 1, nombre: "Valla 3x6m", categoria: "Publicidad Exterior", stock: 45, precio: 5000, ventas: 120, tendencia: "up" },
  { id: 2, nombre: "Banner Vinilo", categoria: "Publicidad Exterior", stock: 12, precio: 1200, ventas: 85, tendencia: "down" },
  { id: 3, nombre: "Diseño Logo", categoria: "Diseño Gráfico", stock: 999, precio: 800, ventas: 200, tendencia: "up" },
  { id: 4, nombre: "Stand Evento", categoria: "Eventos", stock: 8, precio: 3500, ventas: 35, tendencia: "up" },
  { id: 5, nombre: "Flyer Digital", categoria: "Marketing Digital", stock: 999, precio: 300, ventas: 150, tendencia: "down" },
];

const empleadosData = [
  { id: 1, nombre: "Juan Pérez", cargo: "Vendedor", ventas: 125000, comision: 12500, rendimiento: 95 },
  { id: 2, nombre: "María García", cargo: "Diseñadora", proyectos: 45, comision: 9000, rendimiento: 88 },
  { id: 3, nombre: "Carlos López", cargo: "Vendedor", ventas: 98000, comision: 9800, rendimiento: 75 },
  { id: 4, nombre: "Ana Martínez", cargo: "Coordinadora", proyectos: 60, comision: 12000, rendimiento: 92 },
];

export default function MetricasCharts() {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, string> = {
      "Completado": "bg-green-100 text-green-800",
      "En Proceso": "bg-blue-100 text-blue-800",
      "Pendiente": "bg-yellow-100 text-yellow-800",
    };
    return <Badge className={variants[estado] || "bg-gray-100 text-gray-800"}>{estado}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Título de sección */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Métricas y Análisis</h2>
        <p className="text-gray-600 mt-1">
          Visualización de datos clave del negocio
        </p>
      </div>

      {/* Primera fila: Ingresos vs Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="mr-2 h-5 w-5" />
            Ingresos vs Gastos
          </CardTitle>
          <CardDescription>
            Comparativa mensual de ingresos y gastos (en Bs.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incomeExpenseData}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number) => `Bs. ${value.toLocaleString()}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ingresos"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIngresos)"
                  name="Ingresos"
                />
                <Area
                  type="monotone"
                  dataKey="gastos"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorGastos)"
                  name="Gastos"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">Bs. 635,000</p>
              <p className="text-xs text-green-600 mt-1">↗ +15.3%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Gastos Totales</p>
              <p className="text-2xl font-bold text-red-600">Bs. 355,000</p>
              <p className="text-xs text-red-600 mt-1">↗ +8.2%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segunda fila: Distribución por Nichos y Sucursales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Nichos de Negocio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PieChart className="mr-2 h-5 w-5" />
              Distribución por Nichos de Negocio
            </CardTitle>
            <CardDescription>
              Ingresos por área de negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={businessNichesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {businessNichesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}%`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {businessNichesData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comparación de Sucursales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="mr-2 h-5 w-5" />
              Sucursales: La Paz vs Santa Cruz
            </CardTitle>
            <CardDescription>
              Comparativa de rendimiento por sucursal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="sucursal" stroke="#6b7280" />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'ventas') return [`Bs. ${value.toLocaleString()}`, 'Ventas'];
                      return [value.toLocaleString(), 'Clientes'];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ventas" fill="#ef4444" name="Ventas (Bs.)" radius={[8, 8, 0, 0]} />
                  <Bar yAxisId="right" dataKey="clientes" fill="#3b82f6" name="Clientes" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600">La Paz</p>
                <p className="text-lg font-bold text-gray-900">Bs. 125,000</p>
                <p className="text-xs text-gray-600">1,847 clientes</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Santa Cruz</p>
                <p className="text-lg font-bold text-gray-900">Bs. 98,000</p>
                <p className="text-xs text-gray-600">1,523 clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de Tablas de Ejemplo */}
      <div className="space-y-6 mt-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ejemplos de Tablas</h2>
          <p className="text-gray-600 mt-1">
            Diferentes tipos de tablas con datos de prueba
          </p>
        </div>

        {/* Tabla 1: Con ordenamiento y badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="mr-2 h-5 w-5" />
              Tabla con Ordenamiento y Estados
            </CardTitle>
            <CardDescription>
              Tabla de ventas con ordenamiento clickeable y badges de estado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('cliente')}
                    >
                      Cliente
                      {sortConfig?.key === 'cliente' && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 -ml-3"
                      onClick={() => handleSort('monto')}
                    >
                      Monto
                      {sortConfig?.key === 'monto' && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Progreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventasData.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-medium">{venta.cliente}</TableCell>
                    <TableCell>{venta.producto}</TableCell>
                    <TableCell>Bs. {venta.monto.toLocaleString()}</TableCell>
                    <TableCell>{getEstadoBadge(venta.estado)}</TableCell>
                    <TableCell>{venta.fecha}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={venta.progreso} className="w-24" />
                        <span className="text-sm text-gray-600">{venta.progreso}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">Bs. {ventasData.reduce((sum, v) => sum + v.monto, 0).toLocaleString()}</TableCell>
                  <TableCell colSpan={3}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla 2: Con acciones y tendencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Package className="mr-2 h-5 w-5" />
              Tabla con Acciones y Tendencias
            </CardTitle>
            <CardDescription>
              Tabla de productos con acciones contextuales e indicadores de tendencia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Tendencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosData.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{producto.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={producto.stock < 20 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {producto.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>Bs. {producto.precio.toLocaleString()}</TableCell>
                    <TableCell>{producto.ventas}</TableCell>
                    <TableCell>
                      {producto.tendencia === 'up' ? (
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span className="text-sm">↑</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          <span className="text-sm">↓</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tabla 3: Con filas expandibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="mr-2 h-5 w-5" />
              Tabla con Filas Expandibles
            </CardTitle>
            <CardDescription>
              Tabla de empleados con detalles expandibles al hacer click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ventas/Proyectos</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Rendimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empleadosData.map((empleado) => (
                  <React.Fragment key={empleado.id}>
                    <TableRow className="cursor-pointer" onClick={() => toggleRow(empleado.id)}>
                      <TableCell>
                        {expandedRows.has(empleado.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{empleado.nombre}</TableCell>
                      <TableCell>{empleado.cargo}</TableCell>
                      <TableCell>
                        {empleado.cargo === "Vendedor" ? `Bs. ${empleado.ventas?.toLocaleString()}` : `${empleado.proyectos} proyectos`}
                      </TableCell>
                      <TableCell>Bs. {empleado.comision.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={empleado.rendimiento} className="w-20" />
                          <span className="text-sm">{empleado.rendimiento}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(empleado.id) && (
                      <TableRow key={`${empleado.id}-expanded`}>
                        <TableCell colSpan={6} className="bg-gray-50">
                          <div className="p-4 space-y-2">
                            <p className="text-sm font-medium">Detalles del empleado:</p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Cargo:</span> {empleado.cargo}
                              </div>
                              <div>
                                <span className="text-gray-600">Comisión:</span> Bs. {empleado.comision.toLocaleString()}
                              </div>
                              <div>
                                <span className="text-gray-600">Rendimiento:</span> {empleado.rendimiento}%
                              </div>
                              <div>
                                <span className="text-gray-600">Estado:</span>{" "}
                                <Badge className={empleado.rendimiento >= 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                  {empleado.rendimiento >= 90 ? "Excelente" : "Bueno"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

