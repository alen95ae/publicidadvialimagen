import billboardsData from "./billboards.json"
import printProductsData from "./print-products.json"

export interface Billboard {
  id: number
  name: string
  images: string[]
  monthlyPrice: number
  location: string
  city: string
  format: string
  type: string
  dimensions: string
  visibility: string
  traffic: string
  lighting: string
  available: boolean
  availableMonths: string[]
  features: string[]
  description: string
  technicalSpecs: Record<string, string>
}

export interface PrintProduct {
  id: number
  name: string
  images: string[]
  pricePerM2: number
  material: string
  durability: string
  recommendedUse: string
  thickness: string
  finish: string
  waterproof: boolean
  category: string
  deliveryTime: string
  features: string[]
  addOns: Array<{
    id: string
    name: string
    price: number
    description: string
  }>
  description: string
  technicalSpecs: Record<string, string>
}

export const billboards: Billboard[] = billboardsData
export const printProducts: PrintProduct[] = printProductsData

// Helper functions
export const getBillboardById = (id: number): Billboard | undefined => {
  return billboards.find((billboard) => billboard.id === id)
}

export const getPrintProductById = (id: number): PrintProduct | undefined => {
  return printProducts.find((product) => product.id === id)
}

export const getBillboardsByCity = (city: string): Billboard[] => {
  return billboards.filter((billboard) => billboard.city.toLowerCase() === city.toLowerCase())
}

export const getPrintProductsByCategory = (category: string): PrintProduct[] => {
  return printProducts.filter((product) => product.category.toLowerCase() === category.toLowerCase())
}

export const getAvailableBillboards = (): Billboard[] => {
  return billboards.filter((billboard) => billboard.available)
}

export const getBillboardsByPriceRange = (min: number, max: number): Billboard[] => {
  return billboards.filter((billboard) => billboard.monthlyPrice >= min && billboard.monthlyPrice <= max)
}

export const getPrintProductsByPriceRange = (min: number, max: number): PrintProduct[] => {
  return printProducts.filter((product) => product.pricePerM2 >= min && product.pricePerM2 <= max)
}
