"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2, ArrowRight, Calendar, Ruler, MapPin, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CartItem {
  id: string
  type: "billboard" | "print"
  name: string
  image: string

  // Billboard specific fields
  monthlyPrice?: number
  selectedMonths?: string[]
  location?: string

  // Print product specific fields
  pricePerM2?: number
  width?: number
  height?: number
  area?: number
  addOns?: Array<{ name: string; price: number }>

  // Common fields
  quantity: number
  totalPrice: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, quantity: newQuantity }
          // Recalculate total price based on item type
          if (item.type === "billboard") {
            updatedItem.totalPrice = (item.monthlyPrice || 0) * (item.selectedMonths?.length || 0) * newQuantity
          } else if (item.type === "print") {
            const basePrice = (item.pricePerM2 || 0) * (item.area || 0)
            const addOnPrice = (item.addOns || []).reduce((sum, addOn) => sum + addOn.price * (item.area || 0), 0)
            updatedItem.totalPrice = (basePrice + addOnPrice) * newQuantity
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const billboardItems = cartItems.filter((item) => item.type === "billboard")
  const printItems = cartItems.filter((item) => item.type === "print")

  const billboardSubtotal = billboardItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const printSubtotal = printItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const subtotal = billboardSubtotal + printSubtotal

  const shipping = printItems.length > 0 ? 15.99 : 0 // Only charge shipping for print products
  const tax = subtotal * 0.21 // Spanish VAT
  const total = subtotal + shipping + tax

  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1)
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-balance">Carrito de Compras</h1>
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <span>Carrito</span>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-8 text-pretty">
            Parece que aún no has añadido ningún producto a tu carrito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#D54644] hover:bg-[#B03A38] text-white" asChild>
              <Link href="/print-shop">Explorar servicios de Impresión</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {billboardItems.length > 0 && (
              <div className="rounded-lg border bg-card">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Alquiler de Vallas</h2>
                  </div>
                  <div className="space-y-4">
                    {billboardItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="col-span-6 flex items-start gap-4">
                            <div className="relative h-20 w-20 rounded-md overflow-hidden shrink-0">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-balance">{item.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground mb-1">Meses seleccionados:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.selectedMonths?.map((month) => (
                                    <Badge key={month} variant="outline" className="text-xs">
                                      {formatMonthName(month)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="text-sm text-muted-foreground">€{item.monthlyPrice}/mes</div>
                            <div className="text-xs text-muted-foreground">{item.selectedMonths?.length} mes(es)</div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-between md:justify-end">
                            <span className="font-medium">€{item.totalPrice.toLocaleString()}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 ml-2"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {printItems.length > 0 && (
              <div className="rounded-lg border bg-card">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Productos de Impresión</h2>
                  </div>
                  <div className="space-y-4">
                    {printItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                          <div className="col-span-6 flex items-start gap-4">
                            <div className="relative h-20 w-20 rounded-md overflow-hidden shrink-0">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-balance">{item.name}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Ruler className="h-3 w-3" />
                                {item.width}m × {item.height}m = {item.area}m²
                              </div>
                              <div className="text-sm text-muted-foreground">€{item.pricePerM2}/m²</div>
                              {item.addOns && item.addOns.length > 0 && (
                                <div className="mt-1">
                                  <p className="text-xs text-muted-foreground">Servicios adicionales:</p>
                                  {item.addOns.map((addOn, index) => (
                                    <Badge key={index} variant="outline" className="text-xs mr-1">
                                      {addOn.name} (+€{addOn.price}/m²)
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="text-sm">
                              €
                              {(
                                (item.pricePerM2 || 0) +
                                (item.addOns?.reduce((sum, addOn) => sum + addOn.price, 0) || 0)
                              ).toFixed(2)}
                              /m²
                            </div>
                            <div className="text-xs text-muted-foreground">{item.area}m²</div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <div className="flex items-center border rounded-md">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-none"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-between md:justify-end">
                            <span className="font-medium">€{item.totalPrice.toFixed(2)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive/80 ml-2"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/billboards">Más Vallas</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/print-shop">Más Productos</Link>
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setCartItems([])}>
                Vaciar Carrito
              </Button>
            </div>
          </div>

          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>
                <div className="space-y-4">
                  {billboardItems.length > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Alquiler de vallas</span>
                        <span>€{billboardSubtotal.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  {printItems.length > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Productos de impresión</span>
                        <span>€{printSubtotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  {shipping > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Envío</span>
                      <span>€{shipping.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">IVA (21%)</span>
                    <span>€{tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-medium text-lg">
                    <span>Total</span>
                    <span className="text-primary">€{total.toFixed(2)}</span>
                  </div>

                  <div className="pt-4">
                    <Button className="w-full bg-primary hover:bg-primary/90" size="lg" asChild>
                      <Link href="/checkout">
                        Proceder al Pago
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">o</span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Input type="text" placeholder="Código de descuento" className="rounded-r-none" />
                        <Button className="rounded-l-none bg-primary hover:bg-primary/90">Aplicar</Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                    {billboardItems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Las vallas se activarán en las fechas seleccionadas</span>
                      </div>
                    )}
                    {printItems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Productos de impresión: 2-5 días laborables</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
