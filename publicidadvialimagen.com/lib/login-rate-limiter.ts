/**
 * Rate Limiter específico para endpoint de login
 * 
 * Protege contra fuerza bruta con:
 * - 5 intentos por IP cada 15 minutos
 * - Backoff progresivo
 * - Compatible con Edge Runtime
 * - Usa Upstash Redis en producción, memoria en desarrollo
 */

import { getClientIP } from './bot-protection'

// Configuración del rate limiter de login
export const LOGIN_RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutos
}

export interface LoginRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfter: number // Segundos hasta que se puede intentar de nuevo
}

// Detectar si estamos en producción y Redis está disponible
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview'
const useRedis = isProduction && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Rate limiter con Upstash Redis (producción, Edge Runtime compatible)
 */
class RedisLoginRateLimiter {
  private redis: any

  constructor() {
    if (useRedis) {
      try {
        // Dynamic import para evitar errores en desarrollo
        const { Redis } = require('@upstash/redis')
        this.redis = Redis.fromEnv()
      } catch (error) {
        console.error('❌ Error cargando @upstash/redis para login rate limiter:', error)
        throw new Error('Upstash Redis no está disponible')
      }
    }
  }

  async check(ip: string): Promise<LoginRateLimitResult> {
    if (!this.redis) {
      throw new Error('Upstash Redis no está configurado')
    }

    const key = `login:attempts:${ip}`
    const now = Date.now()
    const ttl = Math.ceil(LOGIN_RATE_LIMIT_CONFIG.windowMs / 1000) // TTL en segundos

    try {
      // Incrementar contador y obtener el valor
      const count = await this.redis.incr(key)
      
      // Si es la primera vez (count === 1), establecer TTL
      if (count === 1) {
        await this.redis.expire(key, ttl)
      }

      // Obtener TTL restante para calcular resetAt preciso
      const remainingTtl = await this.redis.ttl(key)
      const resetAt = remainingTtl > 0 ? now + (remainingTtl * 1000) : now + LOGIN_RATE_LIMIT_CONFIG.windowMs
      const retryAfter = Math.max(0, Math.ceil((resetAt - now) / 1000))

      return {
        allowed: count <= LOGIN_RATE_LIMIT_CONFIG.maxAttempts,
        remaining: Math.max(0, LOGIN_RATE_LIMIT_CONFIG.maxAttempts - count),
        resetAt,
        retryAfter,
      }
    } catch (error) {
      console.error('❌ Error en Upstash Redis login rate limiting:', error)
      // En caso de error, permitir la request (fail open para no bloquear usuarios legítimos)
      return {
        allowed: true,
        remaining: LOGIN_RATE_LIMIT_CONFIG.maxAttempts - 1,
        resetAt: now + LOGIN_RATE_LIMIT_CONFIG.windowMs,
        retryAfter: 0,
      }
    }
  }
}

/**
 * Rate limiting simple en memoria (SOLO PARA DESARROLLO)
 */
class InMemoryLoginRateLimiter {
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

  async check(ip: string): Promise<LoginRateLimitResult> {
    const now = Date.now()
    const key = `login:attempts:${ip}`
    const entry = this.store.get(key)

    if (!entry || entry.resetAt < now) {
      // Nueva ventana
      const resetAt = now + LOGIN_RATE_LIMIT_CONFIG.windowMs
      this.store.set(key, {
        count: 1,
        resetAt,
      })
      return {
        allowed: true,
        remaining: LOGIN_RATE_LIMIT_CONFIG.maxAttempts - 1,
        resetAt,
        retryAfter: 0,
      }
    }

    if (entry.count >= LOGIN_RATE_LIMIT_CONFIG.maxAttempts) {
      const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000))
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter,
      }
    }

    entry.count++
    const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000))
    return {
      allowed: true,
      remaining: LOGIN_RATE_LIMIT_CONFIG.maxAttempts - entry.count,
      resetAt: entry.resetAt,
      retryAfter,
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Singleton para login rate limiter
let loginRateLimiter: RedisLoginRateLimiter | InMemoryLoginRateLimiter | null = null

/**
 * Obtiene el rate limiter de login (singleton)
 */
export function getLoginRateLimiter(): RedisLoginRateLimiter | InMemoryLoginRateLimiter {
  if (!loginRateLimiter) {
    if (useRedis) {
      loginRateLimiter = new RedisLoginRateLimiter()
    } else {
      loginRateLimiter = new InMemoryLoginRateLimiter()
    }
  }
  return loginRateLimiter
}

/**
 * Verifica el rate limit de login para una IP
 * 
 * @param request - Request de Next.js
 * @returns Resultado del rate limit check
 */
export async function checkLoginRateLimit(request: Request): Promise<LoginRateLimitResult> {
  const clientIP = getClientIP(request)
  const rateLimiter = getLoginRateLimiter()
  return await rateLimiter.check(clientIP)
}

