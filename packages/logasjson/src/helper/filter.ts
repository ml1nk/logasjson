import type { LogLevel } from '../enums/loglevel.js'

const v4 = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

export function filterTraceId (traceId: string | string[] | undefined): string | undefined {
  if (traceId === undefined || Array.isArray(traceId) || !v4.test(traceId)) return undefined
  return traceId
}

export function filterLogLevel (logLevel: string | string[] | undefined): LogLevel | undefined {
  if (logLevel === undefined || Array.isArray(logLevel)) return undefined
  const loglevel = parseInt(logLevel)
  if (isNaN(loglevel) || loglevel < 0 || loglevel > 4) return undefined
  return loglevel
}
