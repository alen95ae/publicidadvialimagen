"use client"

import { useState, useEffect, useCallback } from 'react'

interface SignUpData {
  email: string
  password: string
  name?: string
}

interface SignInData {
  email: string
  password: string
}

interface User {
  id: string
  email: string
  name?: string
  role?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar usuario actual
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setUser(data.user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // Registro con email y contraseña
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (res.ok) {
        setUser(result.user)
        return { data: result.user, error: null }
      }
      return { data: null, error: { message: result.error } }
    } catch (error) {
      return { data: null, error: { message: 'Error en el registro' } }
    }
  }, [])

  // Login con email y contraseña
  const signIn = useCallback(async (data: SignInData) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (res.ok) {
        setUser(result.user)
        return { data: result.user, error: null }
      }
      return { data: null, error: { message: result.error } }
    } catch (error) {
      return { data: null, error: { message: 'Error en el login' } }
    }
  }, [])

  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
      return { error: null }
    } catch (error) {
      console.error('Error en logout:', error)
      return { error: { message: 'Error al cerrar sesión' } }
    }
  }, [])

  // Recuperar contraseña
  const resetPassword = useCallback(async (email: string) => {
    return { data: null, error: { message: 'Funcionalidad no disponible' } }
  }, [])

  // Actualizar perfil
  const updateProfile = useCallback(async (updates: {
    name?: string
  }) => {
    try {
      // Simular actualización exitosa
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Error al actualizar el perfil' } }
    }
  }, [])

  return {
    user,
    session: user ? { user } : null,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  }
}

