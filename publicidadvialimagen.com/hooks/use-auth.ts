"use client"

import { useState, useEffect, useCallback } from 'react'
import { useKindeAuth } from '@kinde-oss/kinde-auth-nextjs'

interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    login,
    register,
    logout
  } = useKindeAuth()


  // Registro con email y contraseña
  const signUp = useCallback(async (data: SignUpData) => {
    try {
      await register()
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Error en el registro' } }
    }
  }, [register])

  // Login con email y contraseña
  const signIn = useCallback(async (data: SignInData) => {
    try {
      await login()
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Error en el login' } }
    }
  }, [login])

  // Login con Google
  const signInWithGoogle = useCallback(async () => {
    try {
      await login()
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Error en el login con Google' } }
    }
  }, [login])

  // Login con Facebook
  const signInWithFacebook = useCallback(async () => {
    try {
      await login()
      return { data: null, error: { message: 'Error en el login con Facebook' } }
    } catch (error) {
      return { data: null, error: { message: 'Error en el login con Facebook' } }
    }
  }, [login])

  // Cerrar sesión
  const signOut = useCallback(async () => {
    try {
      await logout()
      return { error: null }
    } catch (error) {
      console.error('Error en logout:', error)
      return { error: { message: 'Error al cerrar sesión' } }
    }
  }, [logout])

  // Recuperar contraseña
  const resetPassword = useCallback(async (email: string) => {
    // Kinde maneja esto automáticamente en su interfaz
    return { data: null, error: { message: 'Funcionalidad no disponible' } }
  }, [])

  // NOTA: El cambio de contraseña ahora se maneja directamente con el componente
  // RegisterLink de Kinde en los componentes que lo necesiten.
  // No usamos una función updatePassword porque Kinde maneja esto de forma segura.

  // Actualizar perfil
  const updateProfile = useCallback(async (updates: {
    firstName?: string
    lastName?: string
    avatar_url?: string
  }) => {
    try {
      // Simular actualización exitosa (en un entorno real, esto se conectaría con la API de Kinde)
      // Por ahora, solo simulamos que funciona
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { data: null, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Error al actualizar el perfil' } }
    }
  }, [])

  return {
    user: isAuthenticated ? user : null,
    session: isAuthenticated ? { user } : null,
    loading: isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    updateProfile,
  }
}

