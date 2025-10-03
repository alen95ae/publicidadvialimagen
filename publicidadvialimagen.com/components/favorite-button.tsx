"use client"

import { Heart, Loader2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"
import { cn } from "@/lib/utils"

interface FavoriteButtonProps {
  soporteId: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
  className?: string
}

export default function FavoriteButton({
  soporteId,
  variant = "outline",
  size = "icon",
  showText = false,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [loading, setLoading] = useState(false)
  const favorite = isFavorite(soporteId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setLoading(true)
    await toggleFavorite(soporteId)
    setLoading(false)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        favorite && "text-red-500 hover:text-red-600",
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "h-4 w-4",
            favorite && "fill-current"
          )}
        />
      )}
      {showText && (
        <span className="ml-2">
          {favorite ? "Guardado" : "Guardar"}
        </span>
      )}
    </Button>
  )
}

