import type { LogLevel } from '../enums/loglevel.js'

/**
 * Override allows to define overrides for the LogLevel based on logger and context.
 * It is created once in Logger and used in every fork to allow to override the LogLevel for all forks at once.
 */
export class Override {
  readonly #data = new Map<string, LogLevel>()

  #toKey (context: string | undefined, logger: string | undefined): string {
    return JSON.stringify([context, logger])
  }

  /**
   * Get LogLevel override if existing based on logger and context.
   * This will be used inside LoggerFork to check if there is a matching override.
   * @param logger 
   * @param context 
   * @returns 
   */
  getLogLevel (logger: string, context: string | undefined): LogLevel | undefined {
    let logLevel = this.#data.get(this.#toKey(context, logger))
    if (logLevel !== undefined) return logLevel
    if (context !== undefined) logLevel = this.#data.get(this.#toKey(context, undefined))
    if (logLevel !== undefined) return logLevel
    return this.#data.get(this.#toKey(undefined, logger))
  }

  // Set LogLevel override for context.
  setByContext (logLevel: LogLevel, context: string): void {
    this.#data.set(this.#toKey(context, undefined), logLevel)
  }

  // Delete override by context.
  deleteByContext (context: string): void {
    this.#data.delete(this.#toKey(context, undefined))
  }

  // Set LogLevel override for context.
  setByLogger (logLevel: LogLevel, logger: string): void {
    this.#data.set(this.#toKey(undefined, logger), logLevel)
  }

  /**
   * Delete override by logger.
   * @param logger 
   */
  deleteByLogger (logger: string): void {
    this.#data.delete(this.#toKey(undefined, logger))
  }

  /**
   * Set LogLevel override for logger and/or context.
   * @param logLevel 
   * @param logger 
   * @param context 
   */
  set (logLevel: LogLevel, logger?: string, context?: string): void {
    this.#data.set(this.#toKey(context, logger), logLevel)
  }

  /**
   * Delete override by logger and/or context.
   * @param logger 
   * @param context 
   */
  delete (logger?: string, context?: string): void {
    this.#data.delete(this.#toKey(context, logger))
  }

  /**
   * Clear all overrides.
   */
  clear (): void {
    this.#data.clear()
  }
}
