/**
 * Sistema de métricas para monitoreo de bots
 */

export interface BotMetrics {
  timestamp: number
  ip: string
  country?: string
  pathname: string
  userAgent: string
  riskScore: number
  action: 'allowed' | 'blocked' | 'challenged' | 'rate_limited'
  reason?: string
}

// En producción, enviar a un servicio de logging (Vercel Analytics, Datadog, etc.)
export function logBotEvent(metrics: BotMetrics) {
  // Log estructurado para análisis
  console.log('[BOT_METRICS]', JSON.stringify(metrics))

  // En producción, podrías enviar a:
  // - Vercel Analytics
  // - Datadog
  // - CloudWatch
  // - Tu propio servicio de logging
  
  // Ejemplo con Vercel Analytics:
  // if (typeof window !== 'undefined' && window.va) {
  //   window.va('track', 'bot_detection', metrics)
  // }
}

