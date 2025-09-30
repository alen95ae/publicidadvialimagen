import { auth } from "@/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  if (!isLoggedIn && nextUrl.pathname.startsWith('/panel')) {
    return Response.redirect(new URL('/login', nextUrl))
  }
})

export const config = { matcher: ["/panel/:path*"] }
