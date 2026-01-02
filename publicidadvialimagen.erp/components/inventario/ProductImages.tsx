"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Trash2 } from "lucide-react"

interface ProductImagesProps {
  editing: boolean
  formData: {
    imagen_portada: string
  }
  producto: {
    imagen_portada?: string
    nombre: string
  } | null
  uploadingImage: boolean
  imageError: string
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveImage: () => void
}

export function ProductImages({
  editing,
  formData,
  producto,
  uploadingImage,
  imageError,
  handleImageChange,
  handleRemoveImage
}: ProductImagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagen Principal</CardTitle>
        <CardDescription>Agrega una imagen de portada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-center">
                {formData.imagen_portada ? (
                  <div className="relative group">
                    <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100 relative">
                      <Image 
                        src={formData.imagen_portada} 
                        alt="Imagen de portada" 
                        fill
                        className="object-cover"
                        sizes="128px"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-gray-400 text-xs">Error</span></div>'
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-90 hover:opacity-100 h-6 px-2"
                      onClick={handleRemoveImage}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="aspect-square w-32 flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 transition-colors">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">Sin imagen</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  id="imagen_portada"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadingImage}
                  onClick={() => {
                    const input = document.getElementById('imagen_portada') as HTMLInputElement
                    input?.click()
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {uploadingImage 
                    ? 'Subiendo...' 
                    : formData.imagen_portada 
                      ? 'Cambiar imagen' 
                      : 'Seleccionar imagen'
                  }
                </Button>
                {imageError && (
                  <p className="text-sm text-red-600 mt-1">{imageError}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 text-center">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
            </div>
          </>
        ) : (
          <>
            {producto && (
              <div>
                <div className="flex justify-center">
                  {producto.imagen_portada ? (
                    <div className="aspect-square w-32 overflow-hidden rounded-md border-2 border-gray-200 bg-gray-100 relative">
                      <Image 
                        src={producto.imagen_portada} 
                        alt={producto.nombre} 
                        fill
                        className="object-cover"
                        sizes="128px"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full"><span class="text-gray-400 text-xs">Error</span></div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-32 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Sin imagen</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}













