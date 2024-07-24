import type { ZlibOptions } from 'zlib'

import type { LoggerDestination } from './logger.js'

export interface LokiStream {
  stream: Record<string, string | undefined>
  values: Array<[string, string]>
}

export interface LokiOptions {
  host: string
  compression?: boolean
  fallback?: LoggerDestination
  labels?: Record<string, string>
  zliboptions?: ZlibOptions
  authentication?: {
    username: string
    password: string
  }
}
