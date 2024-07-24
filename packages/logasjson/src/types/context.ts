import type { LoggerOptions } from './logger.js'

export interface ContextOptions {
  name?: string
  traceId?: string
  logger?: LoggerOptions
  store?: Map<string, any> | Array<[string, any]>
  inherit?: boolean
}

export type ContextResultSafe<T> = T extends abstract new (...args: any[]) => any ? InstanceType<T> : (T extends 'number' ? number : T extends 'string' ? string : (T extends 'boolean' ? boolean : never))
