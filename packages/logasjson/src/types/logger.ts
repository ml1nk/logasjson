import type { LogLevel } from '../enums/loglevel.js'

export interface LoggerEntry {
  context?: string
  logger?: string
  timestamp: number
  logLevel: LogLevel
  message: string
  traceId?: string
  [key: string]: any
}

export interface LoggerOptions {
  logLevel?: LogLevel | undefined
  data?: Record<string, any> | undefined
  destination?: LoggerDestination | undefined
}

export interface LoggerStaticOverride {
  logger: string | undefined
  context: string | undefined
}

export type LoggerLog = (message: string, data?: Record<string, any>, trace?: boolean) => void

export interface LoggerDestination {
  write: (data: LoggerEntry) => void
  flush?: () => Promise<void>
}

export interface LoggerDestinationBatch<T> {
  process: (p: T | undefined, data: LoggerEntry) => T
  send: (data: T) => void
  flush?: () => Promise<void>
}
