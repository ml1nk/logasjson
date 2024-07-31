/* eslint-disable @typescript-eslint/max-params */

import { LogLevel } from '../enums/loglevel.js'
import type { LoggerOptions, LoggerLog, LoggerForkOptions, LoggerContext } from '../types/logger.js'
import { processLog } from '../helper/processLog.js'

export class LoggerFork {
  protected readonly options: LoggerOptions

  /**
   * LogLevel in the current context.
   */
  get logLevel (): LogLevel {
    const context = this.options.context?.()
    return this.#contextLogLevel(context)
  }

  /**
   * TracveId in the current context.
   */
  get traceId (): string | undefined {
    const context = this.options.context?.()
    return context?.traceId
  }

  protected constructor (options: LoggerOptions) {
    this.options = options
  }

  /**
   * Fork logger, forked logger have the same override object and destination,
   * but can have antoher logLevel and additional data.
   * @param options
   * @returns 
   */
  fork (options: LoggerForkOptions = {}): LoggerFork {
    return new LoggerFork({
        logLevel: options.logLevel ?? this.options.logLevel,
        destination: this.options.destination,
        override: this.options.override,
        data: Object.assign({}, this.options.data, options.data),
        context: this.options.context,
        name: [this.options.name, options.name].filter(e => e !== undefined && e !== "").join(':')
      })
  }

  /**
   * Returns debug level log function if LogLevel is high enough.
   **/ 
  get debug (): LoggerLog | undefined {
    return this.#log(LogLevel.Debug)
  }

  /**
   * Returns info level log function if LogLevel is high enough.
   **/ 
  get info (): LoggerLog | undefined {
    return this.#log(LogLevel.Info)
  }

  /**
   * Returns warn level log function if LogLevel is high enough.
   **/ 
  get warn (): LoggerLog | undefined {
    return this.#log(LogLevel.Warn)
  }

  /**
   * Returns error level log function if LogLevel is high enough.
   **/ 
  get error (): LoggerLog | undefined {
    return this.#log(LogLevel.Error)
  }

  #contextLogLevel (context: LoggerContext | undefined): number {
    const logLevel = this.options.override.getLogLevel(this.options.name ?? '', context?.name)
    if (logLevel !== undefined) return logLevel
    return context?.logLevel ?? this.options.logLevel
  }

  #log (logLevel: LogLevel): LoggerLog | undefined {
    const context = this.options.context?.()
    if (logLevel < this.#contextLogLevel(context)) return undefined
    return (message: string, data?: Record<string, any>, trace?: boolean): void => {
      this.options.destination.write(processLog(context, logLevel, this.options.name ?? '', this.options, message, data, trace))
    }
  }
}
