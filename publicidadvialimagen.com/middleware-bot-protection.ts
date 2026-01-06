/**
 * Middleware de protección contra bots
 * Se integra con el middleware principal
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  detectBot,
  getRateLimiter,
  getClientIP,
  RATE_LIMIT_CONFIG,
  isLegitimateCrawler,
  getCountryFromHeaders,
  isHighRiskCountry,
} from '@/lib/bot-protection'

// Endpoints críticos que requieren protección extra
const CRITICAL_ENDPOINTS = [
  '/api/form/submit',
  '/api/messages',
  '/api/solicitudes',
  '/api/auth/login',
  '/api/auth/register',
]

// Rutas que siempre deben permitirse (SEO, health checks)
const ALWAYS_ALLOW = [
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/_next',
  '/api/health',
]

export async function botProtectionMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent') || ''
  const method = request.method

  // 1. Siempre permitir rutas esenciales
  if (ALWAYS_ALLOW.some(route => pathname.startsWith(route))) {
    return null // Continuar sin bloqueo
  }

  // 2. Whitelist de crawlers legítimos (SEO-safe)
  // TODO: Agregar verificación por reverse DNS para Googlebot/Bingbot
  // para evitar spoofing de User-Agent
  if (isLegitimateCrawler(userAgent)) {
    // Verificar reverse DNS para Googlebot (opcional, requiere DNS lookup)
    // Por ahora, confiamos en el User-Agent
    return null // Permitir crawlers legítimos
  }

  // 3. Detectar bots
  const botDetection = detectBot(request)

  // 4. Rate limiting adaptativo
  // Usa Upstash Redis en producción, memoria en desarrollo
  const clientIP = getClientIP(request)
  const country = getCountryFromHeaders(request.headers)
  const isHighRisk = isHighRiskCountry(country || null)
  const isCriticalEndpoint = CRITICAL_ENDPOINTS.some(ep => pathname.startsWith(ep))

  // Determinar configuración de rate limit
  let rateLimitConfig = RATE_LIMIT_CONFIG.public
  if (isCriticalEndpoint) {
    rateLimitConfig = method === 'POST' ? RATE_LIMIT_CONFIG.form : RATE_LIMIT_CONFIG.api
  }
  if (isHighRisk) {
    rateLimitConfig = RATE_LIMIT_CONFIG.highRisk
  }

  const rateLimiter = getRateLimiter()
  const rateLimitKey = `ratelimit:${clientIP}:${pathname}`
  const rateLimitResult = await rateLimiter.check(
    rateLimitKey,
    rateLimitConfig.requests,
    rateLimitConfig.windowMs
  )

  // 5. Aplicar bloqueos según riesgo
  if (botDetection.shouldBlock) {
    console.warn(`🚫 BOT BLOQUEADO: ${clientIP} - ${pathname}`, {
      reasons: botDetection.reasons,
      riskScore: botDetection.riskScore,
      country,
    })

    return new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        message: 'Traffic from automated sources is not allowed',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Blocked': 'true',
          'X-Block-Reason': botDetection.reasons.join('; '),
        },
      }
    )
  }

  // 6. Rate limit excedido
  if (!rateLimitResult.allowed) {
    console.warn(`⏱️ RATE LIMIT EXCEDIDO: ${clientIP} - ${pathname}`, {
      country,
      isHighRisk,
      isCriticalEndpoint,
    })

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitConfig.requests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
        },
      }
    )
  }

  // 7. Challenge para riesgo medio (opcional - puede requerir JS challenge)
  if (botDetection.shouldChallenge && isCriticalEndpoint) {
    // Por ahora, solo logueamos. En producción, podrías implementar un JS challenge
    console.log(`⚠️ CHALLENGE RECOMENDADO: ${clientIP} - ${pathname}`, {
      riskScore: botDetection.riskScore,
      reasons: botDetection.reasons,
    })

    // Opcional: agregar header para que el frontend muestre un challenge
    const response = NextResponse.next()
    response.headers.set('X-Bot-Challenge', 'recommended')
    return response
  }

  // 8. Permitir request (agregar headers informativos)
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', rateLimitConfig.requests.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString())

  if (botDetection.riskScore > 0) {
    response.headers.set('X-Bot-Risk-Score', botDetection.riskScore.toString())
  }

  return response
}

