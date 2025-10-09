"use client"

import { User, FileText, Settings, LogOut, TrendingUp, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"

export default function UserMenu() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const getInitials = () => {
    if (user?.given_name) {
      return `${user.given_name[0]}${user.family_name?.[0] || ''}`.toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getUserName = () => {
    if (user?.given_name && user?.family_name) {
      return `${user.given_name} ${user.family_name}`
    }
    if (user?.given_name) {
      return user.given_name
    }
    return user?.email || 'Usuario'
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/login">
          <User className="h-5 w-5" />
          <span className="sr-only">Iniciar Sesión</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
            {getInitials()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = "/account"
          }} 
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = "/account#campaigns"
          }} 
          className="cursor-pointer"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          <span>Campañas</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = "/account#quotes"
          }} 
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Cotizaciones</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.location.href = "/account#messages"
          }} 
          className="cursor-pointer"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Mensajes</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutLink postLogoutRedirectURL="/login">
          <DropdownMenuItem className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </LogoutLink>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

