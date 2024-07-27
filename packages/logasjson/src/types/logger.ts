import type { Override } from '../classes/Override.js'
import type { LogLevel } from '../enums/loglevel.js'


export interface LoggerContext extends LoggerForkOptions {
  traceId?: string | undefined
}

export interface LoggerEntry {
  context?: string | undefined
  logger?: string | undefined
  timestamp: number
  logLevel: LogLevel
  message: string
  traceId?: string | undefined
  [key: string]: any
}

export type LoggerInitOptions = Omit<LoggerOptions, 'override' | 'destination'> & { override?: Override | undefined, destination?: LoggerDestination | undefined }

export interface LoggerOptions {
  logLevel: LogLevel 
  data?: Record<string, any> | undefined
  name?: string | undefined
  destination: LoggerDestination
  override: Override
  context?: (() => LoggerContext | undefined) | undefined
}

export interface LoggerForkOptions {
  logLevel?: LogLevel | undefined
  data?: Record<string, any> | undefined
  name?: string | undefined
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
