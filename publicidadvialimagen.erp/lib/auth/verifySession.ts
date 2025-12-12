import jwt from 'jsonwebtoken'

export function verifySession(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!)
}
