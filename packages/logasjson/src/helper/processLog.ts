import type { LogLevel } from "../enums/loglevel.js"
import type { LoggerForkOptions, LoggerEntry, LoggerContext } from "../types/logger.js"
import { placeholder } from "./placeholder.js"

// eslint-disable-next-line @typescript-eslint/max-params
export function processLog (
    context: LoggerContext | undefined,
    logLevel: LogLevel,
    name: string,
    options: LoggerForkOptions,
    message: string,
    data?: Record<string, any>,
    trace?: boolean): LoggerEntry {
    const d = Object.assign({}, options.data, context?.data, data)
  
    d.logger = name

    if (context !== undefined) {
      d.traceId = context?.traceId
      d.context = context?.name
    }

    d.logLevel = logLevel

    d.message = placeholder(message, d)
    if (trace === true) d.trace = (new Error()).stack
    d.timestamp = Date.now()

    return d as LoggerEntry
  }