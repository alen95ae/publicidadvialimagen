/**
 * Helpers para proteger endpoints de API críticos
 */

import { NextRequest, NextResponse } from 'next/server'
import { detectBot, getClientIP, getCountryFromHeaders, isHighRiskCountry } from './bot-protection'

export interface ProtectionResult {
  allowed: boolean
  response?: NextResponse
  reason?: string
}

/**
 * Valida una request en un endpoint crítico
 */
export function validateCriticalEndpoint(
  request: NextRequest,
  requireJS: boolean = true
): ProtectionResult {
  const userAgent = request.headers.get('user-agent') || ''
  const clientIP = getClientIP(request)
  const country = getCountryFromHeaders(request.headers)

  // 1. Detección de bot
  const botDetection = detectBot(request)
  if (botDetection.shouldBlock) {
    return {
      allowed: false,
      response: new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Automated requests are not allowed',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
      reason: `Bot detected: ${botDetection.reasons.join(', ')}`,
    }
  }

  // 2. Verificar ejecución de JavaScript (si se requiere)
  // Esto debe venir del body del formulario
  // El frontend debe enviar un flag 'js: "1"' después de ejecutar JS
  // Esto se valida en el endpoint específico (ya implementado en /api/messages)

  // 3. País de alto riesgo con challenge recomendado
  if (isHighRiskCountry(country || null) && botDetection.riskScore > 30) {
    // Log para monitoreo, pero permitir con advertencia
    console.warn(`⚠️ Request de alto riesgo permitida con advertencia: ${clientIP}`, {
      country,
      riskScore: botDetection.riskScore,
    })
  }

  return { allowed: true }
}

