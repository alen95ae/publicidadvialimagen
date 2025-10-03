"use client"

import { useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
// import { supabase } from '@/lib/supabase' // DISABLED - Migrated to Airtable

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })

  // Inicializar autenticación y escuchar cambios
  // TODO: Implement Airtable authentication
  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setAuthState({
  //       user: session?.user ?? null,
  //       session: session,
  //       loading: false,
  //     })
  //   })
  //   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setAuthState({
  //       user: session?.user ?? null,
  //       session: session,
  //       loading: false,
  //     })
  //   })
  //   return () => subscription.unsubscribe()
  // }, [])

  // Registro con email y contraseña
  const signUp = useCallback(async (data: SignUpData) => {
    // TODO: Implement Airtable authentication
    console.log('SignUp disabled - Airtable migration', data)
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Login con email y contraseña
  const signIn = useCallback(async (data: SignInData) => {
    console.log('SignIn disabled - Airtable migration', data)
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Login con Google
  const signInWithGoogle = useCallback(async () => {
    console.log('SignInWithGoogle disabled - Airtable migration')
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Login con Facebook
  const signInWithFacebook = useCallback(async () => {
    console.log('SignInWithFacebook disabled - Airtable migration')
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Cerrar sesión
  const signOut = useCallback(async () => {
    console.log('SignOut disabled - Airtable migration')
    return { error: null }
  }, [])

  // Recuperar contraseña
  const resetPassword = useCallback(async (email: string) => {
    console.log('ResetPassword disabled - Airtable migration', email)
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Actualizar contraseña
  const updatePassword = useCallback(async (newPassword: string) => {
    console.log('UpdatePassword disabled - Airtable migration', newPassword)
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  // Actualizar perfil
  const updateProfile = useCallback(async (updates: {
    firstName?: string
    lastName?: string
    avatar_url?: string
  }) => {
    console.log('UpdateProfile disabled - Airtable migration', updates)
    return { data: null, error: { message: 'Authentication disabled' } as AuthError }
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  }
}

