import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
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
        
        const user = await prisma.user.findUnique({ where: { email: creds.email } })
        if (!user) {
          console.log('❌ Usuario no encontrado:', creds.email)
          return null
        }
        
        console.log('✅ Usuario encontrado:', { email: user.email, name: user.name, role: user.role })
        
        const ok = await bcrypt.compare(creds.password, user.password)
        if (!ok) {
          console.log('❌ Contraseña incorrecta para:', creds.email)
          return null
        }
        
        console.log('✅ Autenticación exitosa para:', creds.email)
        return { id: user.id, email: user.email, name: user.name, role: user.role }
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
