"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart, Building2, Globe, DollarSign, Users, Eye, MousePointerClick } from "lucide-react";
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
} from "recharts";

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

export default function DashboardCharts() {
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

      {/* Tercera fila: Métricas de Página Web */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Globe className="mr-2 h-5 w-5" />
            Datos de Página Web
          </CardTitle>
          <CardDescription>
            Métricas de rendimiento del sitio web corporativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <Eye className="w-8 h-8 text-red-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">24,847</p>
              <p className="text-sm text-gray-600 mt-1">Visitas totales</p>
              <p className="text-xs text-green-600 mt-1">↗ +18.5%</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">8,542</p>
              <p className="text-sm text-gray-600 mt-1">Usuarios únicos</p>
              <p className="text-xs text-green-600 mt-1">↗ +12.3%</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <MousePointerClick className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">3.8%</p>
              <p className="text-sm text-gray-600 mt-1">Tasa de conversión</p>
              <p className="text-xs text-green-600 mt-1">↗ +0.5%</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
              <DollarSign className="w-8 h-8 text-amber-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">325</p>
              <p className="text-sm text-gray-600 mt-1">Cotizaciones</p>
              <p className="text-xs text-green-600 mt-1">↗ +22.7%</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Tiempo promedio en sitio</p>
                <p className="text-xl font-bold text-gray-900">4m 32s</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Páginas por sesión</p>
                <p className="text-xl font-bold text-gray-900">5.2</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tasa de rebote</p>
                <p className="text-xl font-bold text-gray-900">42.3%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

