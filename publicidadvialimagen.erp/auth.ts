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
        
        // Usuario de prueba hardcodeado para desarrollo
        if (creds.email === 'admin@publicidadvialimagen.com' && creds.password === 'admin123') {
          console.log('✅ Autenticación exitosa para usuario de prueba:', creds.email)
          return { 
            id: '1', 
            email: creds.email, 
            name: 'Administrador Sistema', 
            role: 'admin' 
          }
        }
        
        console.log('❌ Credenciales inválidas para:', creds.email)
        return null
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
