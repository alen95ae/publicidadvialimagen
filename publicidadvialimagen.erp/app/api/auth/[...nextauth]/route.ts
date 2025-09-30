import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { supabaseServer } from "@/lib/supabaseServer"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        console.log('🔐 Intentando autenticar:', { email: creds?.email, hasPassword: !!creds?.password })
        
        if (!creds?.email || !creds?.password) {
          console.log('❌ Credenciales faltantes')
          return null
        }
        
        const { data: user, error } = await supabaseServer
          .from('empleados')
          .select('*')
          .eq('email', creds.email)
          .eq('estado', 'activo')
          .single()
        
        if (error || !user) {
          console.log('❌ Usuario no encontrado:', creds.email)
          return null
        }
        
        console.log('✅ Usuario encontrado:', { email: user.email, nombre: user.nombre, rol: user.rol })
        
        const ok = await bcrypt.compare(creds.password, user.password)
        if (!ok) {
          console.log('❌ Contraseña incorrecta para:', creds.email)
          return null
        }
        
        console.log('✅ Autenticación exitosa para:', creds.email)
        return { 
          id: user.id, 
          email: user.email, 
          name: `${user.nombre} ${user.apellidos}`.trim(), 
          role: user.rol 
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (token?.sub) (session.user as any).id = token.sub
      if (token?.role) (session.user as any).role = token.role
      return session
    }
  }
})

export { handler as GET, handler as POST }
