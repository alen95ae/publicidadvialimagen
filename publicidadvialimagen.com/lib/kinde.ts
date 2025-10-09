import { createKindeServerClient } from '@kinde-oss/kinde-auth-nextjs/server'
import { createKindeClient } from '@kinde-oss/kinde-auth-nextjs'

export const kindeClient = createKindeClient({
  authDomain: process.env.KINDE_ISSUER_URL!,
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  redirectURL: process.env.KINDE_SITE_URL!,
  logoutRedirectURL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL!,
  postLoginRedirectURL: process.env.KINDE_POST_LOGIN_REDIRECT_URL!,
})

export const kindeServerClient = createKindeServerClient({
  authDomain: process.env.KINDE_ISSUER_URL!,
  clientId: process.env.KINDE_CLIENT_ID!,
  clientSecret: process.env.KINDE_CLIENT_SECRET!,
  redirectURL: process.env.KINDE_SITE_URL!,
  logoutRedirectURL: process.env.KINDE_POST_LOGOUT_REDIRECT_URL!,
  postLoginRedirectURL: process.env.KINDE_POST_LOGIN_REDIRECT_URL!,
})
