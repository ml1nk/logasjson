/* eslint-disable @typescript-eslint/max-params */
import { randomUUID } from 'crypto'

import { Context } from './Context.js'
import { Override } from './Override.js'
import { LogLevel } from '../enums/loglevel.js'
import { placeholder } from '../helper/placeholder.js'
import type { LoggerEntry, LoggerLog, LoggerOptions } from '../types/logger.js'

export class Logger {
  public static options: LoggerOptions = {

  }

  public static readonly override = new Override()

  public readonly name: string
  private readonly options: LoggerOptions

  get logLevel (): LogLevel {
    const context = Context.getStore()
    return this.contextLogLevel(context)
  }

  get traceId (): string {
    const context = Context.getStore()
    return context?.traceId ?? randomUUID()
  }

  constructor (name: string = '', options: LoggerOptions = {}) {
    this.name = name
    this.options = options
  }

  extend (name: string = '', options: LoggerOptions = {}): Logger {
    return new Logger(Logger.mergeName(this.name, name), Logger.mergeOptions(this.options, options))
  }

  get debug (): LoggerLog | undefined {
    return this.log(LogLevel.Debug)
  }

  get info (): LoggerLog | undefined {
    return this.log(LogLevel.Info)
  }

  get warn (): LoggerLog | undefined {
    return this.log(LogLevel.Warn)
  }

  get error (): LoggerLog | undefined {
    return this.log(LogLevel.Error)
  }

  public async flush (): Promise<void> {
    const context = Context.getStore()
    const destination = context?.logger.destination ?? this.options.destination ?? Logger.options.destination
    await destination?.flush?.()
  }

  private contextLogLevel (context: Context | undefined): number {
    const logLevel = Logger.override.getLogLevel(this.name, context?.name)
    if (logLevel !== undefined) return logLevel
    return context?.logger.logLevel ?? this.options.logLevel ?? Logger.options.logLevel ?? LogLevel.None
  }

  private log (logLevel: LogLevel): LoggerLog | undefined {
    const context = Context.getStore()
    if (logLevel < this.contextLogLevel(context)) return undefined
    return (message: string, data?: Record<string, any>, trace?: boolean): void => {
      const destination = context?.logger.destination ?? this.options.destination ?? Logger.options.destination
      destination?.write(Logger.processDataRaw(context, logLevel, this.name, this.options, message, data, trace))
    }
  }

  private static processDataRaw (
    context: Context | undefined,
    logLevel: LogLevel,
    name: string,
    options: LoggerOptions,
    message: string,
    data?: Record<string, any>,
    trace?: boolean): LoggerEntry {
    const d: LoggerEntry = Object.assign({}, Logger.options.data, options.data, data, context?.logger.data)
    d.logger = name

    if (context !== undefined) {
      d.traceId = context.traceId
      d.context = context.name
    }

    d.logLevel = logLevel

    d.message = placeholder(message, d)
    if (trace === true) d.trace = (new Error()).stack
    d.timestamp = Date.now()

    return d
  }

  public static processData (
    logLevel: LogLevel,
    name: string,
    options: LoggerOptions,
    message: string,
    data?: Record<string, any>,
    trace?: boolean): LoggerEntry {
    return Logger.processDataRaw(Context.getStore(), logLevel, name, options, message, data, trace)
  }

  public static mergeOptions (
    opt1: LoggerOptions = {},
    opt2: LoggerOptions = {}
  ): LoggerOptions {
    return {
      logLevel: opt2.logLevel ?? opt1.logLevel,
      destination: opt2.destination ?? opt1.destination,
      data: Object.assign({}, opt1.data, opt2.data)
    }
  }

  public static async flush (): Promise<void> {
    await Logger.options.destination?.flush?.()
  }

  public static mergeName (name1: string | undefined, name2: string): string {
    return [name1, name2].filter(e => e !== undefined).join(':')
  }
}
