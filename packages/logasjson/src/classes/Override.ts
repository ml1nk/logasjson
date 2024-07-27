import type { LogLevel } from '../enums/loglevel.js'

export class Override {
  readonly #data = new Map<string, LogLevel>()

  get data (): Map<string, LogLevel> {
    return this.#data
  }

  #toKey (context: string | undefined, logger: string | undefined): string {
    return JSON.stringify([context, logger])
  }

  getLogLevel (logger: string, context: string | undefined): LogLevel | undefined {
    let logLevel = this.#data.get(this.#toKey(context, logger))
    if (logLevel !== undefined) return logLevel
    if (context !== undefined) logLevel = this.#data.get(this.#toKey(context, undefined))
    if (logLevel !== undefined) return logLevel
    return this.#data.get(this.#toKey(undefined, logger))
  }

  setByContext (logLevel: LogLevel, context: string): void {
    this.#data.set(this.#toKey(context, undefined), logLevel)
  }

  deleteByContext (context: string): void {
    this.#data.delete(this.#toKey(context, undefined))
  }

  setByLogger (logLevel: LogLevel, logger: string): void {
    this.#data.set(this.#toKey(undefined, logger), logLevel)
  }

  deleteByLogger (logger: string): void {
    this.#data.delete(this.#toKey(undefined, logger))
  }

  set (logLevel: LogLevel, logger?: string, context?: string): void {
    this.#data.set(this.#toKey(context, logger), logLevel)
  }

  delete (logger?: string, context?: string): void {
    this.#data.delete(this.#toKey(context, logger))
  }

  clear (): void {
    this.#data.clear()
  }
}
