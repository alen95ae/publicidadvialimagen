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
  Info,
  Maximize2,
  Pause,
  Server,
  ShoppingBag,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
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

// Datos para Competitor Analysis (Radar Chart)
const competitorData = [
  { subject: "Precio", A: 75, B: 85 },
  { subject: "Publicidad", A: 90, B: 70 },
  { subject: "Servicios", A: 80, B: 85 },
  { subject: "Canal", A: 70, B: 90 },
  { subject: "Calidad", A: 95, B: 80 },
  { subject: "Durabilidad", A: 85, B: 75 },
  { subject: "Diseño", A: 90, B: 85 },
  { subject: "Variedad", A: 80, B: 90 },
];

// Datos para Sales Chart (Bubble Chart) - Vallas vs Banners por temporada
const salesBubbleData = [
  // Vallas (Product A)
  { temperature: 20, sales: 15000, volume: 120, product: "Vallas" },
  { temperature: 25, sales: 18000, volume: 150, product: "Vallas" },
  { temperature: 30, sales: 22000, volume: 180, product: "Vallas" },
  { temperature: 35, sales: 28000, volume: 200, product: "Vallas" },
  { temperature: 40, sales: 32000, volume: 220, product: "Vallas" },
  { temperature: 45, sales: 35000, volume: 250, product: "Vallas" },
  // Banners (Product B)
  { temperature: 20, sales: 12000, volume: 100, product: "Banners" },
  { temperature: 25, sales: 14000, volume: 120, product: "Banners" },
  { temperature: 30, sales: 16000, volume: 140, product: "Banners" },
  { temperature: 35, sales: 18000, volume: 160, product: "Banners" },
  { temperature: 40, sales: 20000, volume: 180, product: "Banners" },
  { temperature: 45, sales: 22000, volume: 200, product: "Banners" },
];

// Separar datos para el gráfico
const vallasData = salesBubbleData.filter(d => d.product === "Vallas");
const bannersData = salesBubbleData.filter(d => d.product === "Banners");

// Datos para Transfer Data (simulación de transferencia de archivos de diseño)
const transferProgress = 45; // 45%
const transferTotal = 80.2; // GB
const transferCurrent = 36.09; // GB
const transferSpeed = 3.25; // Mb/s
const transferEstimation = 32; // minutos
const transferFiles = 1029;

// Datos para Contributer Heatmap (proyectos completados por día)
// Generar datos de ejemplo para los últimos 6 meses
const generateHeatmapData = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const data: any[] = [];
  
  // Generar datos más realistas (más actividad en días laborables)
  months.forEach((month, monthIdx) => {
    const daysInMonth = monthIdx === 1 ? 28 : 30; // Febrero tiene 28 días
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeekIdx = (day + monthIdx * 2) % 7;
      const dayOfWeek = daysOfWeek[dayOfWeekIdx];
      
      // Más actividad en días laborables (Lun-Vie)
      let contributions = 0;
      if (dayOfWeekIdx >= 1 && dayOfWeekIdx <= 5) {
        // Días laborables: más actividad
        contributions = Math.floor(Math.random() * 4) + 1; // 1-4
        if (Math.random() > 0.7) contributions = 4; // 30% de probabilidad de alta actividad
      } else {
        // Fines de semana: menos actividad
        contributions = Math.random() > 0.5 ? 1 : 0;
      }
      
      data.push({
        month,
        day,
        dayOfWeek,
        dayOfWeekIdx,
        contributions,
      });
    }
  });
  
  return data;
};

const heatmapData = generateHeatmapData();
const totalContributionsThisYear = heatmapData.reduce((sum, d) => sum + d.contributions, 0);
const totalContributionsLastYear = Math.floor(totalContributionsThisYear * 0.7); // 70% del año actual

// Agrupar datos por mes y día de la semana para el heatmap
const heatmapGrid: { [key: string]: number } = {};
heatmapData.forEach(d => {
  const key = `${d.month}-${d.dayOfWeekIdx}`;
  heatmapGrid[key] = (heatmapGrid[key] || 0) + d.contributions;
});

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

      {/* Sección de Ejemplos Adicionales */}
      <div className="space-y-6 mt-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ejemplos Adicionales</h2>
          <p className="text-gray-600 mt-1">
            Visualizaciones de ejemplo sin datos
          </p>
        </div>

        {/* Ejemplo 1: Competitor Analysis - Radar Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                <CardTitle className="text-lg">Competitor Analysis</CardTitle>
                <Info className="ml-2 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competitorData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                  />
                  <Radar
                    name="Publicidad Exterior"
                    dataKey="A"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Marketing Digital"
                    dataKey="B"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span className="text-sm text-gray-600">Publicidad Exterior</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Marketing Digital</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 2: Sales Chart - Bubble Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Sales of Product A & Product B</CardTitle>
                <Info className="ml-2 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">1,428</p>
                <p className="text-sm text-gray-600">Vallas Sales</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">428</p>
                <p className="text-sm text-gray-600">Banners Sales</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">Vallas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-sm text-gray-600">Banners</span>
              </div>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    type="number" 
                    dataKey="temperature" 
                    name="Temporada" 
                    unit="°C"
                    domain={[15, 50]}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="sales" 
                    name="Ventas" 
                    unit=" Bs."
                    domain={[0, 40000]}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <ZAxis type="number" dataKey="volume" range={[50, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'sales') return [`Bs. ${value.toLocaleString()}`, 'Ventas'];
                      if (name === 'volume') return [value, 'Cantidad'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Scatter name="Vallas" data={vallasData} fill="#a855f7" />
                  <Scatter name="Banners" data={bannersData} fill="#4ade80" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 3: Transfer Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="mr-2 h-5 w-5" />
                <CardTitle className="text-lg">Transfer Data</CardTitle>
                <Info className="ml-2 h-4 w-4 text-gray-400" />
              </div>
              <Button variant="outline" size="sm">
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <p className="text-4xl font-bold text-gray-900 mb-2">{transferTotal} Gb</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Speed: {transferSpeed} Mb/s</span>
                  <span>Estimation: {transferEstimation} Minutes</span>
                  <span>File: {transferFiles.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{transferProgress}%</div>
                    <div className="text-sm text-gray-600">{transferCurrent} Gb</div>
                  </div>
                </div>
                <div 
                  className="absolute top-0 left-0 h-32 bg-purple-200 rounded-lg flex items-center justify-center transition-all duration-300"
                  style={{ width: `${transferProgress}%` }}
                >
                </div>
                {/* Gráfico de área simulada */}
                <div className="mt-4 h-16 bg-gray-50 rounded-lg relative overflow-hidden">
                  <svg className="w-full h-full">
                    <defs>
                      <linearGradient id="transferGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 40 Q 50 20, 100 30 T 200 25 T 300 35 T 400 20 T 500 30"
                      fill="url(#transferGradient)"
                      stroke="#a855f7"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplo 4: Contributer - Heatmap */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                <CardTitle className="text-lg">Contributer</CardTitle>
                <Info className="ml-2 h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{totalContributionsThisYear.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Proyectos completados este año</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{totalContributionsLastYear.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Proyectos completados el año pasado</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 text-xs text-gray-600 mb-2">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded bg-purple-100"></div>
                  <div className="w-3 h-3 rounded bg-purple-200"></div>
                  <div className="w-3 h-3 rounded bg-purple-300"></div>
                  <div className="w-3 h-3 rounded bg-purple-400"></div>
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                </div>
                <span>Más</span>
              </div>
              
              <div className="h-[200px] w-full bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <div className="grid grid-cols-7 gap-1 h-full min-w-[400px]">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, dayIdx) => (
                    <div key={day} className="flex flex-col gap-1">
                      <div className="text-xs text-gray-500 text-center mb-1 h-4">
                        {dayIdx % 2 === 0 ? day : ''}
                      </div>
                      <div className="flex-1 grid grid-rows-6 gap-1">
                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((month, monthIdx) => {
                          const key = `${month}-${dayIdx}`;
                          const intensity = heatmapGrid[key] || 0;
                          const colors = [
                            'bg-purple-100',
                            'bg-purple-200',
                            'bg-purple-300',
                            'bg-purple-400',
                            'bg-purple-500',
                          ];
                          const colorClass = intensity === 0 
                            ? 'bg-gray-100' 
                            : colors[Math.min(intensity - 1, 4)];
                          
                          return (
                            <div
                              key={`${day}-${month}`}
                              className={`w-full h-3 rounded ${colorClass} hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer`}
                              title={`${day} ${month}: ${intensity} proyectos`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 px-1">
                  <span>Ene</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

