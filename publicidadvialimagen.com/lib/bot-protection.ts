/**
 * Sistema de protección contra bots - Utilidades centrales
 * Detecta y mitiga tráfico automatizado desde regiones de alto riesgo
 */

export interface BotDetectionResult {
  isBot: boolean
  riskScore: number // 0-100
  reasons: string[]
  country?: string
  shouldBlock: boolean
  shouldChallenge: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// Países de alto riesgo (Asia + algunos otros)
export const HIGH_RISK_COUNTRIES = [
  'CN', // China
  'IN', // India
  'VN', // Vietnam
  'BD', // Bangladesh
  'ID', // Indonesia
  'PK', // Pakistan
  'TH', // Thailand
  'PH', // Philippines
  'RU', // Russia
  'UA', // Ukraine (puede tener bots)
  'TR', // Turkey
  'BR', // Brazil (alto tráfico bot)
] as const

// User-Agents conocidos de bots/scrapers
export const BOT_USER_AGENTS = [
  'scrapy',
  'curl',
  'wget',
  'python-requests',
  'python-urllib',
  'go-http-client',
  'java/',
  'apache-httpclient',
  'okhttp',
  'postman',
  'insomnia',
  'httpie',
  'axios',
  'node-fetch',
  'bot',
  'crawler',
  'spider',
  'scraper',
  'headless',
  'phantom',
  'selenium',
  'puppeteer',
  'playwright',
  'webdriver',
  'automation',
]

// Crawlers legítimos (whitelist SEO-safe)
// TODO: Implementar verificación por reverse DNS para Googlebot/Bingbot
// para evitar spoofing de User-Agent
export const LEGITIMATE_CRAWLERS = [
  'googlebot',
  'bingbot',
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'ia_archiver', // Archive.org
]

// Rate limit configs por tipo de endpoint
export const RATE_LIMIT_CONFIG = {
  // Endpoints públicos (GET)
  public: {
    requests: 100,
    windowMs: 60000, // 1 minuto
  },
  // Endpoints de formularios (POST)
  form: {
    requests: 10,
    windowMs: 60000, // 1 minuto
  },
  // Endpoints de API críticos
  api: {
    requests: 20,
    windowMs: 60000, // 1 minuto
  },
  // IPs de alto riesgo
  highRisk: {
    requests: 5,
    windowMs: 60000, // 1 minuto
  },
} as const

/**
 * Detecta si un User-Agent es un bot conocido
 */
export function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent || userAgent.trim() === '') {
    return true // UA vacío = bot probable
  }

  const ua = userAgent.toLowerCase()

  // Whitelist primero (crawlers legítimos)
  for (const crawler of LEGITIMATE_CRAWLERS) {
    if (ua.includes(crawler)) {
      return false
    }
  }

  // Blacklist de bots conocidos
  for (const botUA of BOT_USER_AGENTS) {
    if (ua.includes(botUA)) {
      return true
    }
  }

  // Patrones sospechosos
  if (
    ua.length < 10 || // UA muy corto
    ua.match(/^[a-z]+\/[0-9.]+$/) || // Formato genérico "tool/version"
    !ua.includes('mozilla') && !ua.includes('webkit') && !ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox') // No es un navegador real
  ) {
    return true
  }

  return false
}

/**
 * Obtiene el país desde headers de Cloudflare/Vercel
 * Cloudflare: CF-IPCountry
 * Vercel: x-vercel-ip-country
 */
export function getCountryFromHeaders(headers: Headers): string | null {
  // Cloudflare
  const cfCountry = headers.get('cf-ipcountry')
  if (cfCountry && cfCountry !== 'XX' && cfCountry.length === 2) {
    return cfCountry
  }

  // Vercel
  const vercelCountry = headers.get('x-vercel-ip-country')
  if (vercelCountry && vercelCountry.length === 2) {
    return vercelCountry
  }

  // Fallback: intentar desde x-forwarded-for (requiere servicio externo)
  return null
}

/**
 * Detecta si una IP/país es de alto riesgo
 */
export function isHighRiskCountry(country: string | null): boolean {
  if (!country) return false
  return HIGH_RISK_COUNTRIES.includes(country.toUpperCase() as any)
}

/**
 * Analiza una request y determina si es un bot
 */
export function detectBot(request: Request): BotDetectionResult {
  const reasons: string[] = []
  let riskScore = 0
  const userAgent = request.headers.get('user-agent') || ''
  const country = getCountryFromHeaders(request.headers)
  const pathname = new URL(request.url).pathname

  // 1. Verificar User-Agent
  if (isBotUserAgent(userAgent)) {
    reasons.push('Bot User-Agent detectado')
    riskScore += 40
  }

  // 2. Verificar país de alto riesgo
  if (isHighRiskCountry(country || null)) {
    reasons.push(`País de alto riesgo: ${country}`)
    riskScore += 30
  }

  // 3. Verificar headers sospechosos
  const accept = request.headers.get('accept') || ''
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''

  // Headers inconsistentes o faltantes
  if (!accept || accept === '*/*') {
    reasons.push('Header Accept genérico o faltante')
    riskScore += 10
  }

  if (!acceptLanguage) {
    reasons.push('Header Accept-Language faltante')
    riskScore += 5
  }

  // 4. Verificar si es un endpoint crítico
  const criticalEndpoints = ['/api/form/submit', '/api/messages', '/api/solicitudes']
  const isCriticalEndpoint = criticalEndpoints.some(ep => pathname.startsWith(ep))
  if (isCriticalEndpoint) {
    riskScore += 10 // Endpoints críticos aumentan el riesgo
  }

  // 5. Verificar método HTTP
  if (request.method === 'POST' && riskScore > 20) {
    riskScore += 10 // POSTs de alto riesgo son más sospechosos
  }

  const isBot = riskScore >= 30 // Threshold ajustable
  const shouldBlock = riskScore >= 70
  const shouldChallenge = riskScore >= 40 && riskScore < 70

  return {
    isBot,
    riskScore,
    reasons,
    country: country || undefined,
    shouldBlock,
    shouldChallenge,
  }
}

/**
 * Verifica si un crawler es legítimo (para SEO)
 * 
 * TODO: Implementar verificación por reverse DNS para Googlebot/Bingbot
 * para evitar spoofing de User-Agent. Ejemplo:
 * 
 * async function verifyGooglebot(ip: string): Promise<boolean> {
 *   try {
 *     const hostnames = await dns.reverse(ip)
 *     return hostnames.some(host => host.endsWith('.googlebot.com'))
 *   } catch {
 *     return false
 *   }
 * }
 */
export function isLegitimateCrawler(userAgent: string): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return LEGITIMATE_CRAWLERS.some(crawler => ua.includes(crawler))
}

/**
 * Rate limiting con Upstash Redis (producción) o memoria (desarrollo)
 * 
 * Detecta automáticamente el entorno y usa el método apropiado:
 * - Producción: Upstash Redis (requiere UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN)
 * - Desarrollo: Memoria (fallback automático)
 * 
 * Compatible con Edge Runtime de Next.js
 */

// Detectar si estamos en producción y Redis está disponible
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
const useRedis = isProduction && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

// Rate limiter con Upstash Redis (producción, Edge Runtime compatible)
class RedisRateLimiter {
  private redis: any

  constructor() {
    if (useRedis) {
      try {
        // Dynamic import para evitar errores en desarrollo
        // @upstash/redis es compatible con Edge Runtime
        const { Redis } = require('@upstash/redis')
        this.redis = Redis.fromEnv()
      } catch (error) {
        console.error('❌ Error cargando @upstash/redis:', error)
        throw new Error('Upstash Redis no está disponible')
      }
    }
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    if (!this.redis) {
      throw new Error('Upstash Redis no está configurado')
    }

    const now = Date.now()
    const resetAt = now + windowMs
    const ttl = Math.ceil(windowMs / 1000) // TTL en segundos

    try {
      // Incrementar contador y obtener el valor
      const count = await this.redis.incr(key)
      
      // Si es la primera vez (count === 1), establecer TTL
      if (count === 1) {
        await this.redis.expire(key, ttl)
      }

      // Obtener TTL restante para calcular resetAt preciso
      const remainingTtl = await this.redis.ttl(key)
      const actualResetAt = remainingTtl > 0 ? now + (remainingTtl * 1000) : resetAt

      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: actualResetAt,
      }
    } catch (error) {
      console.error('❌ Error en Upstash Redis rate limiting:', error)
      // En caso de error, permitir la request (fail open)
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt,
      }
    }
  }
}

// Rate limiting simple en memoria (SOLO PARA DESARROLLO)
class InMemoryRateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.store.entries()) {
        if (value.resetAt < now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.resetAt < now) {
      // Nueva ventana
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: now + windowMs,
      }
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Singleton para rate limiter
let rateLimiter: RedisRateLimiter | InMemoryRateLimiter | null = null

export function getRateLimiter(): RedisRateLimiter | InMemoryRateLimiter {
  if (!rateLimiter) {
    if (useRedis) {
      console.log('✅ Usando Upstash Redis para rate limiting (producción)')
      rateLimiter = new RedisRateLimiter()
    } else {
      console.log('⚠️ Usando rate limiter en memoria (desarrollo)')
      console.log('   Para producción, asegúrate de que Upstash Redis esté configurado en Vercel')
      rateLimiter = new InMemoryRateLimiter()
    }
  }
  return rateLimiter
}

/**
 * Obtiene la IP real del cliente
 */
export function getClientIP(request: Request): string {
  // Cloudflare
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) return cfConnectingIP

  // Vercel
  const vercelIP = request.headers.get('x-vercel-forwarded-for')
  if (vercelIP) return vercelIP.split(',')[0].trim()

  // Standard
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}

